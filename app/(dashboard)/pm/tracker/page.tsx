import { ActionsTable } from "@/components/tracker/actions-table";
import { DashboardProjectFilter } from "@/components/dashboard/project-filter";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/authz";
import { getAccessibleProjects, resolveSelectedProjectIds } from "@/lib/data/dashboard";
import { prisma } from "@/lib/prisma";

export default async function PmTrackerPage({
  searchParams,
}: {
  searchParams?: { q?: string; includeClosed?: string; overdue?: string; projects?: string; archivedYears?: string };
}) {
  const session = await requireRole(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]);
  const requestedProjectIds = searchParams?.projects
    ? searchParams.projects.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const archivedYears = searchParams?.archivedYears
    ? searchParams.archivedYears.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  const { availableProjects, archivedProjectGroups } = await getAccessibleProjects(session.user.id, session.user.role);
  const { selectedProjectIds, selectedArchivedYears } = resolveSelectedProjectIds({
    availableProjects,
    requestedProjectIds,
    archivedYears,
  });

  const actions = await prisma.feedbackAction.findMany({
    where:
      session.user.role === "ADMIN"
        ? {
            feedbackSubmission: {
              projectId: {
                in: selectedProjectIds,
              },
            },
          }
        : {
            feedbackSubmission: {
              projectId: {
                in: selectedProjectIds,
              },
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
        actions={
          <DashboardProjectFilter
            userId={session.user.id}
            projects={availableProjects}
            selectedProjectIds={selectedProjectIds}
            selectedArchivedYears={selectedArchivedYears}
            archivedProjectGroups={archivedProjectGroups}
            storageNamespace="tracker"
          />
        }
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
          isOverdueResponse:
            Boolean(action.feedbackSubmission.slaDueAt) &&
            action.feedbackSubmission.slaDueAt! < new Date() &&
            !action.firstResponseAt &&
            action.status !== "CLOSED",
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
