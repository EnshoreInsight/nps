import Link from "next/link";
import { ProjectsTable } from "@/components/admin/projects-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminProjectsPage() {
  await requireRole(["ADMIN"]);

  const projects = await prisma.project.findMany({
    include: {
      emailRecipients: {
        include: { user: true },
      },
    },
    where: {
      isArchived: false,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Projects"
        description="Manage public forms, assignment scope, and project metadata from one place."
        actions={
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/projects/archived">Archived projects</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/projects/new">Add project</Link>
            </Button>
          </div>
        }
      />
      <ProjectsTable
        projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          client: project.client,
          slug: project.slug,
          isActive: project.isActive,
          weeklyExportEnabled: project.weeklyExportEnabled,
          isArchived: project.isArchived,
          archivedAt: project.archivedAt?.toISOString() ?? null,
          assignments: project.emailRecipients
            .map((recipient) => ({
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
            }))
            .sort((a, b) => a.userName.localeCompare(b.userName)),
        }))}
      />
    </div>
  );
}
