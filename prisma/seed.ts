import { hash } from "bcryptjs";
import { addDays, subMonths } from "date-fns";
import {
  ContactPreference,
  FeedbackActionStatus,
  Role,
  UrgencyLevel,
} from "@prisma/client";
import {
  DEFAULT_EMAIL_BANNER_URL,
  DEFAULT_EMAIL_SUBJECT_TEMPLATE,
  DEFAULT_EMAIL_TEMPLATE_HTML,
  DEFAULT_TRACKER_BANNER_URL,
} from "@/lib/email/defaults";
import { calculateSlaDueAt, calculateUrgencyLevel } from "@/lib/domain/feedback";
import { CORE_USER_EMAIL, CORE_USER_NAME } from "@/lib/core-user";
import { prisma } from "@/lib/prisma";

type SeedProject = {
  name: string;
  slug: string;
  client: string;
  description: string;
  feedbackIntro?: string;
  thankYouMessage?: string;
  packageOptions: string[];
  categoryOptions: string[];
};

type SeedFeedbackRow = {
  projectSlug: string;
  packageName: string;
  score: number;
  comment: string;
  category: string;
  contactRequested: ContactPreference;
  submittedAt: Date;
  actionStatus?: FeedbackActionStatus;
  contacted?: boolean;
  contactedAt?: Date | null;
  closedAt?: Date | null;
  ownerNotes?: string | null;
  auditDescription?: string;
};

function monthsAgo(months: number, dayOffset: number) {
  return addDays(subMonths(new Date(), months), dayOffset);
}

async function main() {
  await prisma.emailSettings.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.feedbackAction.deleteMany();
  await prisma.feedbackSubmission.deleteMany();
  await prisma.projectEmailRecipient.deleteMany();
  await prisma.projectAssignment.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await hash("Password123!", 10);

  await prisma.emailSettings.create({
    data: {
      key: "global",
      subjectTemplate: DEFAULT_EMAIL_SUBJECT_TEMPLATE,
      bannerUrl: DEFAULT_EMAIL_BANNER_URL,
      trackerBannerUrl: DEFAULT_TRACKER_BANNER_URL,
      templateHtml: DEFAULT_EMAIL_TEMPLATE_HTML,
    },
  });

  const [admin, pm, viewer] = await Promise.all([
    prisma.user.create({
      data: {
        name: CORE_USER_NAME,
        email: CORE_USER_EMAIL,
        passwordHash,
        role: Role.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        name: "Leo Barton",
        email: "pm@enshore.com",
        passwordHash,
        role: Role.PROJECT_REPRESENTATIVE,
      },
    }),
    prisma.user.create({
      data: {
        name: "Nadia Cross",
        email: "ceo@enshore.com",
        passwordHash,
        role: Role.VIEWER,
      },
    }),
  ]);

  const projectDefinitions: SeedProject[] = [
    {
      name: "Alpha Grid Modernisation",
      slug: "alpha-grid",
      client: "North Sea Power",
      description: "Major grid modernisation programme.",
      feedbackIntro: "Help Enshore understand where this programme is landing well and where it needs attention.",
      thankYouMessage: "Thank You",
      packageOptions: [
        "PLGR",
        "Cable Lay",
        "Cable Burial",
        "Cable Jointing",
        "OSP Pull In",
        "Landfall Pull In",
        "Overall Project Management",
      ],
      categoryOptions: ["Quality", "Communication", "Delivery", "Innovation"],
    },
    {
      name: "Horizon Asset Recovery",
      slug: "horizon-recovery",
      client: "Horizon Infrastructure",
      description: "Asset recovery and remediation workstream.",
      feedbackIntro: "Use this form to rate the Horizon workstream and request a follow-up if needed.",
      thankYouMessage: "Thank You",
      packageOptions: ["Planning", "Remediation", "Commercial Support", "Project Management"],
      categoryOptions: ["Quality", "Communication", "Commercial", "Innovation"],
    },
    {
      name: "Triton Decommissioning Support",
      slug: "triton-decom",
      client: "Triton Offshore",
      description: "Decommissioning support package covering offshore planning and vessel coordination.",
      thankYouMessage: "Thank You",
      packageOptions: ["Vessel Support", "Engineering", "Offshore Execution", "Project Controls"],
      categoryOptions: ["Safety", "Quality", "Communication", "Delivery"],
    },
    {
      name: "Orion Cable Integrity",
      slug: "orion-integrity",
      client: "Orion Renewables",
      description: "Cable integrity campaign for inspection, repair readiness, and stakeholder reporting.",
      thankYouMessage: "Thank You",
      packageOptions: ["Inspection", "Data Review", "Repair Readiness", "Client Reporting"],
      categoryOptions: ["Quality", "Communication", "Innovation", "Delivery"],
    },
  ];

  const projects = await Promise.all(
    projectDefinitions.map((project) =>
      prisma.project.create({
        data: project,
      }),
    ),
  );

  await prisma.projectEmailRecipient.createMany({
    data: projects.flatMap((project) => [
      {
        projectId: project.id,
        userId: pm.id,
        name: pm.name,
        email: pm.email,
        receivesL1: true,
        receivesL2: true,
        receivesL3: true,
        receivesL4: false,
      },
      {
        projectId: project.id,
        userId: viewer.id,
        name: viewer.name,
        email: viewer.email,
        receivesL1: false,
        receivesL2: false,
        receivesL3: false,
        receivesL4: true,
      },
    ]),
  });

  const projectBySlug = Object.fromEntries(projects.map((project) => [project.slug, project]));

  const feedbackRows: SeedFeedbackRow[] = [
    {
      projectSlug: "alpha-grid",
      packageName: "PLGR",
      score: 5,
      comment: "We need clearer communication around outage dependencies and the delivery meetings felt rushed.",
      category: "Communication",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(4, 3),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: true,
      contactedAt: monthsAgo(4, 4),
      closedAt: monthsAgo(4, 8),
      ownerNotes: "Called client and agreed revised cadence for weekly delivery calls.",
    },
    {
      projectSlug: "alpha-grid",
      packageName: "Cable Lay",
      score: 8,
      comment: "The offshore team was responsive and well prepared, though we wanted a quick follow-up on drawings.",
      category: "Quality",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(4, 12),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: true,
      contactedAt: monthsAgo(4, 13),
      closedAt: monthsAgo(4, 16),
      ownerNotes: "Follow-up drawings sent and client confirmed close-out.",
    },
    {
      projectSlug: "alpha-grid",
      packageName: "Overall Project Management",
      score: 9,
      comment: "Project controls have been much better this month and reporting is landing well.",
      category: "Delivery",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(3, 1),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: false,
      closedAt: monthsAgo(3, 1),
      ownerNotes: "Logged for dashboard review only.",
    },
    {
      projectSlug: "alpha-grid",
      packageName: "Cable Burial",
      score: 4,
      comment: "Schedule slippage and poor notice on vessel changes created avoidable frustration for our team.",
      category: "Delivery",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(2, 6),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: true,
      contactedAt: monthsAgo(2, 7),
      closedAt: monthsAgo(2, 10),
      ownerNotes: "Escalated internally and shared revised mobilisation notice process.",
    },
    {
      projectSlug: "alpha-grid",
      packageName: "Landfall Pull In",
      score: 7,
      comment: "Landfall coordination improved but some stakeholder updates still feel inconsistent.",
      category: "Communication",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(1, 4),
      actionStatus: FeedbackActionStatus.OPEN,
      contacted: false,
      ownerNotes: "To be discussed during monthly review with the client.",
    },

    {
      projectSlug: "horizon-recovery",
      packageName: "Commercial Support",
      score: 6,
      comment: "Commercial turnaround still needs attention and clarifications arrive too late for our approvals.",
      category: "Commercial",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(4, 7),
      actionStatus: FeedbackActionStatus.OPEN,
      contacted: false,
      ownerNotes: "Commercial lead to review approval workflow with PM.",
    },
    {
      projectSlug: "horizon-recovery",
      packageName: "Planning",
      score: 9,
      comment: "Strong planning discipline and dependable stakeholder management from the recovery team.",
      category: "Innovation",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(3, 5),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: false,
      closedAt: monthsAgo(3, 5),
      ownerNotes: "Positive feedback logged for monthly review pack.",
    },
    {
      projectSlug: "horizon-recovery",
      packageName: "Project Management",
      score: 8,
      comment: "Programme oversight is good, but I would appreciate a short call to confirm close-out priorities.",
      category: "Quality",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(2, 2),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: true,
      contactedAt: monthsAgo(2, 4),
      closedAt: monthsAgo(2, 9),
      ownerNotes: "Held client call and aligned close-out sequence for remaining work packs.",
    },
    {
      projectSlug: "horizon-recovery",
      packageName: "Remediation",
      score: 5,
      comment: "The remediation work feels reactive at times and we need more confidence in the weekly plan.",
      category: "Quality",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(1, 8),
      actionStatus: FeedbackActionStatus.IN_PROGRESS,
      contacted: true,
      contactedAt: monthsAgo(1, 9),
      ownerNotes: "Weekly plan review started; further update due after vessel meeting.",
    },
    {
      projectSlug: "horizon-recovery",
      packageName: "Commercial Support",
      score: 8,
      comment: "Recent commercial support has been better and the team closed queries faster this cycle.",
      category: "Commercial",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(0, -2),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: false,
      closedAt: monthsAgo(0, -2),
      ownerNotes: "Positive item captured for monthly reporting.",
    },

    {
      projectSlug: "triton-decom",
      packageName: "Engineering",
      score: 4,
      comment: "Engineering changes were issued too late and we need a rapid callback from the delivery lead.",
      category: "Quality",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(4, 10),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: true,
      contactedAt: monthsAgo(4, 11),
      closedAt: monthsAgo(4, 15),
      ownerNotes: "Immediate call held and late-change workflow updated.",
    },
    {
      projectSlug: "triton-decom",
      packageName: "Vessel Support",
      score: 7,
      comment: "Offshore execution was solid, though handover notes could still be tightened up.",
      category: "Delivery",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(3, 8),
      actionStatus: FeedbackActionStatus.OPEN,
      contacted: false,
      ownerNotes: "Capture for handover improvement action at next review.",
    },
    {
      projectSlug: "triton-decom",
      packageName: "Project Controls",
      score: 9,
      comment: "Excellent controls support this month and the weekly reporting pack was exactly what we needed.",
      category: "Communication",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(3, 18),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: false,
      closedAt: monthsAgo(3, 18),
      ownerNotes: "Positive feedback captured for PM recognition.",
    },
    {
      projectSlug: "triton-decom",
      packageName: "Offshore Execution",
      score: 6,
      comment: "Execution was safe but still lacked confidence around late scope adjustments.",
      category: "Safety",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(2, 5),
      actionStatus: FeedbackActionStatus.OPEN,
      contacted: false,
      ownerNotes: "Review scope freeze process with offshore superintendent.",
    },
    {
      projectSlug: "triton-decom",
      packageName: "Engineering",
      score: 8,
      comment: "Better alignment this month and the technical queries were handled promptly.",
      category: "Quality",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(1, 6),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: true,
      contactedAt: monthsAgo(1, 8),
      closedAt: monthsAgo(1, 11),
      ownerNotes: "Follow-up call closed out remaining engineering clarifications.",
    },

    {
      projectSlug: "orion-integrity",
      packageName: "Inspection",
      score: 10,
      comment: "Inspection reporting has been first class and turnaround is consistently ahead of expectation.",
      category: "Quality",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(4, 14),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: false,
      closedAt: monthsAgo(4, 14),
      ownerNotes: "Promoter feedback logged for project celebration.",
    },
    {
      projectSlug: "orion-integrity",
      packageName: "Client Reporting",
      score: 5,
      comment: "Client reporting lacked the right level of insight and we need somebody to walk us through the latest pack.",
      category: "Communication",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(3, 3),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: true,
      contactedAt: monthsAgo(3, 4),
      closedAt: monthsAgo(3, 6),
      ownerNotes: "Held review call and agreed revised reporting format.",
    },
    {
      projectSlug: "orion-integrity",
      packageName: "Data Review",
      score: 7,
      comment: "Data review quality is fine, but the pack could be a little easier for non-specialists to digest.",
      category: "Innovation",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(2, 7),
      actionStatus: FeedbackActionStatus.OPEN,
      contacted: false,
      ownerNotes: "Consider adding summary layer to next reporting release.",
    },
    {
      projectSlug: "orion-integrity",
      packageName: "Repair Readiness",
      score: 6,
      comment: "Repair readiness still feels uncertain and we need more clarity on mobilisation assumptions.",
      category: "Delivery",
      contactRequested: ContactPreference.YES,
      submittedAt: monthsAgo(1, 2),
      actionStatus: FeedbackActionStatus.IN_PROGRESS,
      contacted: true,
      contactedAt: monthsAgo(1, 3),
      ownerNotes: "Mobilisation assumptions being revised with operations team.",
    },
    {
      projectSlug: "orion-integrity",
      packageName: "Inspection",
      score: 9,
      comment: "The last campaign was smooth and we appreciated the proactive communication from the team.",
      category: "Communication",
      contactRequested: ContactPreference.NO,
      submittedAt: monthsAgo(0, -6),
      actionStatus: FeedbackActionStatus.CLOSED,
      contacted: false,
      closedAt: monthsAgo(0, -6),
      ownerNotes: "Positive feedback added to dashboard summary.",
    },
  ];

  for (let index = 0; index < feedbackRows.length; index += 1) {
    const row = feedbackRows[index];
    const project = projectBySlug[row.projectSlug];

    const urgencyLevel = calculateUrgencyLevel(row.score, row.contactRequested);
    const submission = await prisma.feedbackSubmission.create({
      data: {
        projectId: project.id,
        client: project.client,
        packageName: row.packageName,
        email: `client.${index + 1}@example.com`,
        score: row.score,
        comment: row.comment,
        category: row.category,
        contactRequested: row.contactRequested,
        urgencyLevel,
        slaDueAt: calculateSlaDueAt(urgencyLevel),
        submittedAt: row.submittedAt,
      },
    });

    const resolvedStatus = row.actionStatus ?? (urgencyLevel === UrgencyLevel.LEVEL_4
      ? FeedbackActionStatus.CLOSED
      : FeedbackActionStatus.OPEN);
    const resolvedContacted = row.contacted ?? urgencyLevel === UrgencyLevel.LEVEL_1;
    const resolvedContactedAt =
      row.contactedAt === undefined
        ? resolvedContacted
          ? addDays(row.submittedAt, 1)
          : null
        : row.contactedAt;
    const resolvedClosedAt =
      row.closedAt === undefined
        ? resolvedStatus === FeedbackActionStatus.CLOSED
          ? resolvedContactedAt ?? row.submittedAt
          : null
        : row.closedAt;

    const action = await prisma.feedbackAction.create({
      data: {
        feedbackSubmissionId: submission.id,
        status: resolvedStatus,
        contacted: resolvedContacted,
        firstResponseAt: resolvedContactedAt,
        contactedAt: resolvedContactedAt,
        closedAt: resolvedClosedAt,
        ownerNotes: row.ownerNotes ?? "Awaiting PM review.",
        updatedById:
          resolvedStatus === FeedbackActionStatus.OPEN && !resolvedContacted ? admin.id : pm.id,
        createdAt: row.submittedAt,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: action.updatedById ?? admin.id,
        feedbackActionId: action.id,
        field: "action_update",
        toValue: JSON.stringify({
          status: resolvedStatus,
          contacted: resolvedContacted,
          contactedAt: resolvedContactedAt?.toISOString() ?? "",
          description: row.auditDescription ?? row.ownerNotes ?? "Initial seeded action created.",
        }),
        createdAt: resolvedContactedAt ?? row.submittedAt,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Projects: 4");
  console.log("Feedback submissions: 20");
  console.log("Admin: insight@enshoresubsea.com / Password123!");
  console.log("PM: pm@enshore.com / Password123!");
  console.log("Viewer: ceo@enshore.com / Password123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
