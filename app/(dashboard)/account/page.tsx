import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/authz";

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: { saved?: string };
}) {
  await requireRole(["ADMIN", "PROJECT_REPRESENTATIVE", "VIEWER"]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Account"
        description="Manage your sign-in details."
      />
      <ChangePasswordForm saved={searchParams?.saved === "1"} />
    </div>
  );
}
