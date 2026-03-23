import { AppShell } from "@/components/shell/app-shell";
import { requireSession } from "@/lib/authz";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <AppShell>{children}</AppShell>;
}
