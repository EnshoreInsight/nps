import Link from "next/link";
import { ProjectRecipientsSection } from "@/components/admin/project-recipients-section";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/forms/project-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { saved?: string };
}) {
  await requireRole(["ADMIN"]);

  const [project, users] = await Promise.all([
    prisma.project.findUnique({
      where: { id: params.id },
      include: {
        emailRecipients: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            user: true,
          },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        isArchived: false,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Edit ${project.name}`}
        description="Update project details, public form wording, and project-specific option sets."
        actions={
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href={`/api/admin/projects/${project.id}/feedback-export`}>Download full feedback export</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/projects">Back to projects</Link>
            </Button>
          </div>
        }
      />
      {searchParams?.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Project changes saved.
        </div>
      ) : null}
      <ProjectForm mode="edit" project={project} />
      <ProjectRecipientsSection projectId={project.id} users={users} recipients={project.emailRecipients} />
    </div>
  );
}
