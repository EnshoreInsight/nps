import Link from "next/link";
import { ProjectsTable } from "@/components/admin/projects-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function ArchivedProjectsPage() {
  await requireRole(["ADMIN"]);

  const projects = await prisma.project.findMany({
    where: {
      isArchived: true,
    },
    include: {
      emailRecipients: {
        include: { user: true },
      },
    },
    orderBy: { archivedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Archived Projects"
        description="Review archived projects and restore them when they need to return to the active portfolio."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/projects">Back to projects</Link>
          </Button>
        }
      />
      <ProjectsTable
        archived
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          client: project.client,
          slug: project.slug,
          isActive: project.isActive,
          isArchived: project.isArchived,
          archivedAt: project.archivedAt?.toISOString() ?? null,
          assignments: project.emailRecipients.map((recipient) => ({
            id: recipient.id,
            assignment: [
              recipient.receivesL1 && "L1",
              recipient.receivesL2 && "L2",
              recipient.receivesL3 && "L3",
              recipient.receivesL4 && "L4",
            ]
              .filter(Boolean)
              .join(", "),
            userName: recipient.user?.name ?? recipient.name,
          })),
        }))}
      />
    </div>
  );
}
