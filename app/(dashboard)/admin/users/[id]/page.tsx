import Link from "next/link";
import { notFound } from "next/navigation";
import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";
import { isCoreUserEmail } from "@/lib/core-user";
import { prisma } from "@/lib/prisma";

export default async function EditUserPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { saved?: string };
}) {
  await requireRole(["ADMIN"]);

  const user = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!user) {
    notFound();
  }

  if (user.isArchived) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Edit ${user.name}`}
        description={
          isCoreUserEmail(user.email)
            ? "Update the protected Enshore Insight admin account password if needed."
            : "Update a user account and change the password if needed."
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/users">Back to users</Link>
          </Button>
        }
      />
      {searchParams?.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          User changes saved.
        </div>
      ) : null}
      <UserForm
        mode="edit"
        user={{
          ...user,
          addToAllProjects: user.role === "ADMIN" ? "YES" : user.hasGlobalProjectAccess ? "YES" : "NO",
        }}
      />
    </div>
  );
}
