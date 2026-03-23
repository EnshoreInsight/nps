import { DashboardProjectFilter } from "@/components/dashboard/project-filter";
import { PageHeader } from "@/components/shared/page-header";
import { SubmissionsTable } from "@/components/forms/submissions-table";
import { requireRole } from "@/lib/authz";
import { getAccessibleProjects, resolveSelectedProjectIds } from "@/lib/data/dashboard";
import { prisma } from "@/lib/prisma";

export default async function PmFormsPage({
  searchParams,
}: {
  searchParams?: { q?: string; actionRequired?: string; projects?: string; archivedYears?: string };
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

  const submissions = await prisma.feedbackSubmission.findMany({
    where:
      session.user.role === "ADMIN"
        ? {
            projectId: {
              in: selectedProjectIds,
            },
          }
        : {
            projectId: {
              in: selectedProjectIds,
            },
          },
    include: {
      project: true,
      action: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Received Forms"
        description="Review all submitted feedback in one searchable table, then open any row to see the full details and linked action status."
        actions={
          <DashboardProjectFilter
            userId={session.user.id}
            projects={availableProjects}
            selectedProjectIds={selectedProjectIds}
            selectedArchivedYears={selectedArchivedYears}
            archivedProjectGroups={archivedProjectGroups}
            storageNamespace="forms"
          />
        }
      />
      <SubmissionsTable
        initialQuery={searchParams?.q ?? ""}
        actionRequiredOnly={searchParams?.actionRequired === "1"}
        submissions={submissions.map((submission) => ({
          id: submission.id,
          project: submission.project.name,
          client: submission.client,
          packageName: submission.packageName,
          email: submission.email,
          score: submission.score,
          comment: submission.comment,
          category: submission.category,
          urgencyLevel: submission.urgencyLevel,
          actionRequired: submission.contactRequested === "YES",
          actionOpen: submission.contactRequested === "YES" ? submission.action?.status !== "CLOSED" : false,
          contactRequested: submission.contactRequested === "YES" ? "Yes" : "No",
          submittedAt: submission.submittedAt.toISOString(),
          slaDueAt: submission.slaDueAt?.toISOString() ?? null,
          actionStatus: submission.action?.status ?? null,
          contacted: submission.action?.contacted ?? null,
          firstResponseAt: submission.action?.firstResponseAt?.toISOString() ?? null,
          contactedAt: submission.action?.contactedAt?.toISOString() ?? null,
          closedAt: submission.action?.closedAt?.toISOString() ?? null,
          ownerNotes: submission.action?.ownerNotes ?? "",
        }))}
      />
    </div>
  );
}
