import { ActionsTable } from "@/components/tracker/actions-table";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function PmTrackerPage({
  searchParams,
}: {
  searchParams?: { q?: string; includeClosed?: string; overdue?: string };
}) {
  const session = await requireRole(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]);

  const actions = await prisma.feedbackAction.findMany({
    where:
      session.user.role === "ADMIN"
        ? {}
        : {
            feedbackSubmission: {
              project: {
                OR: [
                  {
                    emailRecipients: {
                      some: { userId: session.user.id },
                    },
                  },
                  {
                    assignments: {
                      some: { userId: session.user.id },
                    },
                  },
                ],
              },
            },
          },
    include: {
      feedbackSubmission: {
        include: { project: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Action Tracker"
        description="Review customer actions in one searchable table, then open any row to update progress and view its full log history."
      />
      <ActionsTable
        initialQuery={searchParams?.q ?? ""}
        initialIncludeClosed={searchParams?.includeClosed === "1"}
        overdueOnly={searchParams?.overdue === "1"}
        actions={actions.map((action) => ({
          id: action.id,
          project: action.feedbackSubmission.project.name,
          category: action.feedbackSubmission.category,
          packageName: action.feedbackSubmission.packageName,
          score: action.feedbackSubmission.score,
          status: action.status,
          urgencyLevel: action.feedbackSubmission.urgencyLevel,
          firstResponseAt: action.firstResponseAt?.toISOString() ?? null,
          closedAt:
            action.closedAt?.toISOString() ??
            (action.status === "CLOSED"
              ? action.contactedAt?.toISOString() ??
                action.firstResponseAt?.toISOString() ??
                action.updatedAt.toISOString() ??
                action.feedbackSubmission.submittedAt.toISOString()
              : null),
          submittedAt: action.feedbackSubmission.submittedAt.toISOString(),
        }))}
      />
    </div>
  );
}
