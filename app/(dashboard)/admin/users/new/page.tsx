import Link from "next/link";
import { UserForm } from "@/components/forms/user-form";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/authz";

export default async function AdminNewUserPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add User"
        description="Create a new internal user account and choose the access role they should start with."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/users">Back to users</Link>
          </Button>
        }
      />
      <UserForm />
    </div>
  );
}
