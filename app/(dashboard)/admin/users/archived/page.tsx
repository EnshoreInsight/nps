import Link from "next/link";
import { UsersTable } from "@/components/admin/users-table";
import { isCoreUserEmail } from "@/lib/core-user";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";
import { prisma } from "@/lib/prisma";

export default async function ArchivedUsersPage() {
  await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    where: {
      isArchived: true,
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
        title="Archived Users"
        description="Review archived users and restore them when they need access again."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/users">Back to users</Link>
          </Button>
        }
      />
      <UsersTable
        archived
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
