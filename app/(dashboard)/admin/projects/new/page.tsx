import { ProjectRecipientsSection } from "@/components/admin/project-recipients-section";
import Link from "next/link";
import { ProjectForm } from "@/components/forms/project-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminNewProjectPage() {
  await requireRole(["ADMIN"]);
  const users = await prisma.user.findMany({
    where: {
      isArchived: false,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add Project"
        description="Create a new project, configure public form content, and define project-specific option sets."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/projects">Back to projects</Link>
          </Button>
        }
      />
      <ProjectForm />
      <ProjectRecipientsSection projectId={undefined} users={users} recipients={[]} />
    </div>
  );
}
