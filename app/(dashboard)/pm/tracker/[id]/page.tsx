import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionDetail } from "@/components/tracker/action-detail";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { ensureProjectAccess, requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function TrackerActionPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { saved?: string };
}) {
  const session = await requireRole(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]);
  const canEdit = session.user.role !== "VIEWER";

  const action = await prisma.feedbackAction.findUnique({
    where: { id: params.id },
    include: {
      feedbackSubmission: {
        include: {
          project: true,
        },
      },
      auditEntries: {
        include: {
          user: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!action) {
    notFound();
  }

  await ensureProjectAccess(action.feedbackSubmission.projectId, session.user.id, session.user.role);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${action.feedbackSubmission.project.name} action`}
        description={canEdit ? "Update this action and review the full response log." : "Review this action and its full response log."}
        actions={
          <Button asChild variant="outline">
            <Link href="/pm/tracker">Back to tracker</Link>
          </Button>
        }
      />
      <ActionDetail action={action} saved={searchParams?.saved === "1"} canEdit={canEdit} />
    </div>
  );
}
