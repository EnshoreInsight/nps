import Link from "next/link";
import { UsersTable } from "@/components/admin/users-table";
import { isCoreUserEmail } from "@/lib/core-user";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    where: {
      isArchived: false,
    },
    include: {
      projectRecipients: {
        include: { project: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="User Management"
        description="Manage internal users and review the project access they currently hold."
        actions={
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/users/archived">Archived users</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/users/new">Add user</Link>
            </Button>
          </div>
        }
      />
      <UsersTable
        users={users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isCore: isCoreUserEmail(user.email),
          projectAccess:
            user.role === "ADMIN" || user.hasGlobalProjectAccess
              ? ["All projects"]
              : user.projectRecipients
                  .filter((recipient) => !recipient.project.isArchived)
                  .map((recipient) => recipient.project.name)
                  .sort((a, b) => a.localeCompare(b)),
        }))}
      />
    </div>
  );
}
