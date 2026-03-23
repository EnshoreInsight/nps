import { EmailSettingsForm } from "@/components/admin/email-settings-form";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/authz";
import { getEmailSettings } from "@/lib/email/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminEmailPage({
  searchParams,
}: {
  searchParams?: { saved?: string };
}) {
  await requireRole(["ADMIN"]);

  const settings = await getEmailSettings();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Email"
        description="Manage the shared notification subject line, banner images, and HTML template used across all projects."
      />
      {searchParams?.saved === "1" ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Email settings saved.
        </div>
      ) : null}
      <EmailSettingsForm
        initialValues={{
          subjectTemplate: settings.subjectTemplate ?? "",
          bannerUrl: settings.bannerUrl ?? "",
          trackerBannerUrl: settings.trackerBannerUrl ?? "",
          templateHtml: settings.templateHtml ?? "",
        }}
      />
    </div>
  );
}
