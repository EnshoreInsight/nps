import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  return session;
}

export async function requireRole(roles: string[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    redirect("/");
  }
  return session;
}

export async function ensureProjectAccess(projectId: string, userId: string, role: string) {
  if (role === "ADMIN") {
    return true;
  }

  const [recipient, assignment] = await Promise.all([
    prisma.projectEmailRecipient.findFirst({
      where: {
        projectId,
        userId,
      },
    }),
    prisma.projectAssignment.findFirst({
      where: {
        projectId,
        userId,
      },
    }),
  ]);

  if (!recipient && !assignment) {
    redirect("/");
  }

  return true;
}
