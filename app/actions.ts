"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ContactPreference, FeedbackActionStatus, Role } from "@prisma/client";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { ensureProjectAccess, requireRole } from "@/lib/authz";
import { calculateSlaDueAt, calculateUrgencyLevel } from "@/lib/domain/feedback";
import { sendFeedbackNotification } from "@/lib/email/send";
import { getEmailSettings } from "@/lib/email/settings";
import { CORE_USER_EMAIL, CORE_USER_NAME, isCoreUserEmail } from "@/lib/core-user";
import { prisma } from "@/lib/prisma";
import { parseOptionText } from "@/lib/project-options";
import {
  emailSettingsSchema,
  feedbackSchema,
  projectSchema,
  projectUpdateSchema,
  trackerUpdateSchema,
  userSchema,
  userUpdateSchema,
} from "@/lib/validations";

export type FormActionState = {
  error?: string;
};

function getValidationMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function grantUserAccessToAllProjects(userId: string, name: string, email: string) {
  const projects = await prisma.project.findMany({
    select: { id: true },
  });

  if (!projects.length) {
    return;
  }

  await prisma.projectEmailRecipient.createMany({
    data: projects.map((project) => ({
      projectId: project.id,
      userId,
      name,
      email,
      receivesL1: false,
      receivesL2: false,
      receivesL3: false,
      receivesL4: false,
    })),
    skipDuplicates: true,
  });
}

async function revokeUserDefaultAllProjectsAccess(userId: string) {
  await prisma.projectEmailRecipient.deleteMany({
    where: {
      userId,
      receivesL1: false,
      receivesL2: false,
      receivesL3: false,
      receivesL4: false,
    },
  });
}

export async function authenticate(_: { error?: string } | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "We could not sign you in with those credentials." };
    }

    throw error;
  }

  return { error: undefined };
}

export async function createProject(_: FormActionState | undefined, formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const parsed = projectSchema.safeParse({
      name: formData.get("name"),
      slug: formData.get("slug"),
      client: formData.get("client"),
      description: formData.get("description"),
      feedbackIntro: formData.get("feedbackIntro"),
      thankYouMessage: formData.get("thankYouMessage"),
      packageOptions: formData.get("packageOptions"),
      categoryOptions: formData.get("categoryOptions"),
    });

    if (!parsed.success) {
      return {
        error:
          "Please complete the required project fields. Project name, public form slug, and client name are mandatory, and the slug must use only lowercase letters, numbers, and hyphens.",
      };
    }

    const existingProject = await prisma.project.findFirst({
      where: {
        OR: [{ name: { equals: parsed.data.name, mode: "insensitive" } }, { slug: parsed.data.slug }],
      },
    });

    if (existingProject) {
      return {
        error:
          "That project name or public form slug is already in use. Please choose a unique project name and slug before saving.",
      };
    }

    await prisma.project.create({
      data: {
        ...parsed.data,
        packageOptions: parseOptionText(parsed.data.packageOptions),
        categoryOptions: parseOptionText(parsed.data.categoryOptions),
      },
    });

    revalidatePath("/admin/projects");
    revalidatePath("/admin/projects/new");
    revalidatePath("/admin/projects/archived");
    return {};
  } catch (error) {
    return {
      error: getValidationMessage(
        error,
        "We could not create the project. Please review the form and try again.",
      ),
    };
  }
}

export async function updateProject(_: FormActionState | undefined, formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const parsed = projectUpdateSchema.safeParse({
      projectId: formData.get("projectId"),
      slug: formData.get("slug"),
      client: formData.get("client"),
      description: formData.get("description"),
      feedbackIntro: formData.get("feedbackIntro"),
      thankYouMessage: formData.get("thankYouMessage"),
      packageOptions: formData.get("packageOptions"),
      categoryOptions: formData.get("categoryOptions"),
    });

    if (!parsed.success) {
      return {
        error:
          "Please complete the required project fields. Client name is required, and the slug must stay unique and use only lowercase letters, numbers, and hyphens.",
      };
    }

    const existingSlug = await prisma.project.findFirst({
      where: {
        slug: parsed.data.slug,
        NOT: {
          id: parsed.data.projectId,
        },
      },
    });

    if (existingSlug) {
      return {
        error: "That public form slug is already being used by another project. Please choose a different slug.",
      };
    }

    await prisma.project.update({
      where: { id: parsed.data.projectId },
      data: {
        slug: parsed.data.slug,
        client: parsed.data.client,
        description: parsed.data.description,
        feedbackIntro: parsed.data.feedbackIntro,
        thankYouMessage: parsed.data.thankYouMessage,
        packageOptions: parseOptionText(parsed.data.packageOptions),
        categoryOptions: parseOptionText(parsed.data.categoryOptions),
      },
    });

    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${parsed.data.projectId}`);
    revalidatePath("/admin/projects/archived");
    redirect(`/admin/projects/${parsed.data.projectId}?saved=1`);
  } catch (error) {
    return {
      error: getValidationMessage(
        error,
        "We could not save the project changes. Please review the form and try again.",
      ),
    };
  }
}

export async function createUser(_: FormActionState | undefined, formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const parsed = userSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      addToAllProjects: formData.get("addToAllProjects"),
    });

    if (!parsed.success) {
      return {
        error:
          "Please complete the required user fields. Full name, email address, role, and a password of at least 8 characters are required.",
      };
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
      },
    });

    if (existingUser) {
      return {
        error: "That email address is already assigned to another user. Please use a different email address.",
      };
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hash(parsed.data.password, 10),
        role: parsed.data.role as Role,
        hasGlobalProjectAccess: parsed.data.addToAllProjects === "YES",
      },
    });

    if (parsed.data.addToAllProjects === "YES") {
      await grantUserAccessToAllProjects(user.id, user.name, user.email);
    }

    revalidatePath("/admin/users");
    revalidatePath("/admin/users/new");
    return {};
  } catch (error) {
    return {
      error: getValidationMessage(
        error,
        "We could not create the user. Please review the form and try again.",
      ),
    };
  }
}

export async function archiveUser(formData: FormData) {
  await requireRole(["ADMIN"]);

  const userId = String(formData.get("userId"));
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (isCoreUserEmail(user.email)) {
    throw new Error("The Enshore Insight core user cannot be archived.");
  }

  await prisma.$transaction([
    prisma.projectEmailRecipient.deleteMany({
      where: { userId },
    }),
    prisma.projectAssignment.deleteMany({
      where: { userId },
    }),
    prisma.user.update({
      where: { id: userId },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        hasGlobalProjectAccess: false,
      },
    }),
  ]);

  revalidatePath("/admin/users");
  revalidatePath("/admin/users/archived");
  revalidatePath("/admin/projects");
}

export async function restoreUser(formData: FormData) {
  await requireRole(["ADMIN"]);

  const userId = String(formData.get("userId"));

  await prisma.user.update({
    where: { id: userId },
    data: {
      isArchived: false,
      archivedAt: null,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/users/archived");
}

export async function updateUser(_: FormActionState | undefined, formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const parsed = userUpdateSchema.safeParse({
      userId: formData.get("userId"),
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      addToAllProjects: formData.get("addToAllProjects"),
    });

    if (!parsed.success) {
      return {
        error:
          "Please complete the required user fields. Full name, email address, and role are required. If you enter a new password, it must be at least 8 characters.",
      };
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: parsed.data.userId },
    });

    if (!currentUser) {
      return { error: "That user could not be found. Please return to the users list and try again." };
    }

    if (isCoreUserEmail(currentUser.email)) {
      if (
        parsed.data.name !== CORE_USER_NAME ||
        parsed.data.email.toLowerCase() !== CORE_USER_EMAIL ||
        parsed.data.role !== Role.ADMIN
      ) {
        return {
          error:
            "The Enshore Insight core user must keep its fixed name, email address, and Admin role. You can still update its password if needed.",
        };
      }
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        email: parsed.data.email,
        NOT: {
          id: parsed.data.userId,
        },
      },
    });

    if (existingUser) {
      return {
        error: "That email address is already assigned to another user. Please use a different email address.",
      };
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role as Role,
        hasGlobalProjectAccess: parsed.data.addToAllProjects === "YES",
        isArchived: false,
        ...(parsed.data.password
          ? {
              passwordHash: await hash(parsed.data.password, 10),
            }
          : {}),
      },
    });

    await prisma.projectEmailRecipient.updateMany({
      where: { userId: parsed.data.userId },
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
      },
    });

    if (parsed.data.addToAllProjects === "YES") {
      await grantUserAccessToAllProjects(parsed.data.userId, parsed.data.name, parsed.data.email);
    } else {
      await revokeUserDefaultAllProjectsAccess(parsed.data.userId);
    }

    revalidatePath("/admin/users");
    revalidatePath(`/admin/users/${parsed.data.userId}`);
    revalidatePath("/admin/projects");
    redirect(`/admin/users/${parsed.data.userId}?saved=1`);
  } catch (error) {
    return {
      error: getValidationMessage(
        error,
        "We could not save the user changes. Please review the form and try again.",
      ),
    };
  }
}

export async function createRecipient(formData: FormData) {
  await requireRole(["ADMIN"]);

  const projectId = String(formData.get("projectId"));
  const userId = String(formData.get("userId"));

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("Selected user not found.");
  }

  await prisma.projectEmailRecipient.create({
    data: {
      projectId,
      userId: user.id,
      name: user.name,
      email: user.email,
      receivesL1: formData.get("receivesL1") === "on",
      receivesL2: formData.get("receivesL2") === "on",
      receivesL3: formData.get("receivesL3") === "on",
      receivesL4: formData.get("receivesL4") === "on",
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateRecipient(formData: FormData) {
  await requireRole(["ADMIN"]);

  const recipientId = String(formData.get("recipientId"));
  const projectId = String(formData.get("projectId"));

  await prisma.projectEmailRecipient.update({
    where: { id: recipientId },
    data: {
      receivesL1: formData.get("receivesL1") === "on",
      receivesL2: formData.get("receivesL2") === "on",
      receivesL3: formData.get("receivesL3") === "on",
      receivesL4: formData.get("receivesL4") === "on",
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function removeRecipient(formData: FormData) {
  await requireRole(["ADMIN"]);

  const recipientId = String(formData.get("recipientId"));
  const projectId = String(formData.get("projectId"));

  await prisma.projectEmailRecipient.delete({
    where: { id: recipientId },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/admin/users");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function submitFeedback(formData: FormData) {
  const parsed = feedbackSchema.safeParse({
    projectId: formData.get("projectId"),
    client: formData.get("client"),
    packageName: formData.get("packageName"),
    email: formData.get("email"),
    score: formData.get("score"),
    comment: formData.get("comment"),
    category: formData.get("category"),
    contactRequested: formData.get("contactRequested"),
  });

  if (!parsed.success) {
    throw new Error("Invalid feedback payload.");
  }

  const urgencyLevel = calculateUrgencyLevel(
    parsed.data.score,
    parsed.data.contactRequested as ContactPreference,
  );
  const slaDueAt = calculateSlaDueAt(urgencyLevel);

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: {
      emailRecipients: true,
    },
  });
  const emailSettings = await getEmailSettings();

  if (!project) {
    throw new Error("Project not found.");
  }

  const submission = await prisma.feedbackSubmission.create({
    data: {
      projectId: parsed.data.projectId,
      client: parsed.data.client,
      packageName: parsed.data.packageName,
      email: parsed.data.email,
      score: parsed.data.score,
      comment: parsed.data.comment ?? "",
      category: parsed.data.category,
      contactRequested: parsed.data.contactRequested as ContactPreference,
      urgencyLevel,
      slaDueAt,
      action: {
        create: {},
      },
    },
    include: {
      action: true,
    },
  });

  const trackerLink = submission.action
    ? `${process.env.APP_BASE_URL}/pm/tracker?action=${submission.action.id}#action-${submission.action.id}`
    : `${process.env.APP_BASE_URL}/pm/tracker`;

  try {
    await sendFeedbackNotification({
      recipientRules: project.emailRecipients,
      responseId: submission.id,
      urgencyLevel,
      projectName: project.name,
      submittedAt: submission.submittedAt,
      client: submission.client,
      packageName: submission.packageName,
      email: submission.email,
      score: submission.score,
      comment: submission.comment,
      category: submission.category,
      contactRequested: submission.contactRequested === ContactPreference.YES ? "Yes" : "No",
      subjectTemplate: emailSettings.subjectTemplate,
      templateHtml: emailSettings.templateHtml,
      bannerUrl: emailSettings.bannerUrl ?? process.env.EMAIL_BANNER_URL,
      trackerBannerUrl: emailSettings.trackerBannerUrl,
      slaDue: submission.slaDueAt,
      trackerLink,
    });
  } catch (error) {
    console.error("Failed to send feedback notification", error);
  }

  revalidatePath(`/f/${project.slug}`);
  redirect(`/f/${project.slug}?submitted=1`);
}

export async function updateAction(formData: FormData) {
  const session = await requireRole(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]);
  const returnPath = String(formData.get("returnPath") || `/pm/tracker/${String(formData.get("actionId"))}`);

  const parsed = trackerUpdateSchema.safeParse({
    actionId: formData.get("actionId"),
    contacted: formData.get("contacted") === "true",
    contactedAt: formData.get("contactedAt"),
    ownerNotes: formData.get("ownerNotes"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error("Invalid tracker update.");
  }

  const current = await prisma.feedbackAction.findUnique({
    where: { id: parsed.data.actionId },
    include: {
      feedbackSubmission: true,
    },
  });

  if (!current) {
    throw new Error("Action not found.");
  }

  await ensureProjectAccess(current.feedbackSubmission.projectId, session.user.id, session.user.role);

  const updates = {
    contacted: parsed.data.contacted,
    contactedAt: parsed.data.contactedAt ? new Date(parsed.data.contactedAt) : null,
    firstResponseAt:
      parsed.data.contacted && !current.firstResponseAt
        ? parsed.data.contactedAt
          ? new Date(parsed.data.contactedAt)
          : new Date()
        : current.firstResponseAt,
    closedAt:
      parsed.data.status === FeedbackActionStatus.CLOSED
        ? current.closedAt ?? new Date()
        : null,
    ownerNotes: parsed.data.ownerNotes || null,
    status: parsed.data.status as FeedbackActionStatus,
    updatedById: session.user.id,
  };

  await prisma.feedbackAction.update({
    where: { id: parsed.data.actionId },
    data: updates,
  });

  const hasChanges =
    current.contacted !== updates.contacted ||
    (current.contactedAt?.toISOString() ?? "") !== (updates.contactedAt?.toISOString() ?? "") ||
    (current.ownerNotes ?? "") !== (updates.ownerNotes ?? "") ||
    current.status !== updates.status;

  if (hasChanges) {
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        feedbackActionId: current.id,
        field: "action_update",
        toValue: JSON.stringify({
          status: updates.status,
          contacted: updates.contacted,
          contactedAt: updates.contactedAt?.toISOString() ?? "",
          description: updates.ownerNotes ?? "",
        }),
      },
    });
  }

  revalidatePath("/pm/tracker");
  revalidatePath(`/pm/tracker/${parsed.data.actionId}`);
  revalidatePath("/dashboard");
  revalidatePath("/pm/dashboard");
  revalidatePath("/ceo/dashboard");
  redirect(`${returnPath}?saved=1`);
}

export async function archiveProject(formData: FormData) {
  await requireRole(["ADMIN"]);

  await prisma.project.update({
    where: { id: String(formData.get("projectId")) },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      isActive: false,
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/admin/projects/archived");
}

export async function restoreProject(formData: FormData) {
  await requireRole(["ADMIN"]);

  await prisma.project.update({
    where: { id: String(formData.get("projectId")) },
    data: {
      isArchived: false,
      archivedAt: null,
      isActive: true,
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath("/admin/projects/archived");
}

export async function touchFormConfiguration(formData: FormData) {
  await requireRole(["ADMIN"]);
  const projectId = String(formData.get("projectId"));

  await prisma.project.update({
    where: { id: projectId },
    data: {
      feedbackIntro: String(formData.get("feedbackIntro") ?? ""),
      thankYouMessage: String(formData.get("thankYouMessage") ?? ""),
      packageOptions: parseOptionText(formData.get("packageOptions")),
      categoryOptions: parseOptionText(formData.get("categoryOptions")),
    },
  });

  revalidatePath("/admin/projects");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateEmailSettings(_: FormActionState | undefined, formData: FormData) {
  await requireRole(["ADMIN"]);

  try {
    const parsed = emailSettingsSchema.safeParse({
      subjectTemplate: formData.get("subjectTemplate"),
      bannerUrl: formData.get("bannerUrl"),
      trackerBannerUrl: formData.get("trackerBannerUrl"),
      templateHtml: formData.get("templateHtml"),
    });

    if (!parsed.success) {
      return {
        error:
          "Please complete all required email settings. Add a subject line, valid banner URLs, and an HTML template before saving.",
      };
    }

    await prisma.emailSettings.upsert({
      where: { key: "global" },
      update: parsed.data,
      create: {
        key: "global",
        ...parsed.data,
      },
    });

    revalidatePath("/admin/email");
    redirect("/admin/email?saved=1");
  } catch (error) {
    return {
      error: getValidationMessage(
        error,
        "We could not save the email settings. Please review the form and try again.",
      ),
    };
  }
}
