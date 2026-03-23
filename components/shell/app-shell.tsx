import Link from "next/link";
import { auth } from "@/lib/auth";
import { APP_NAME, NAV_ITEMS } from "@/lib/constants";
import { SignOutButton } from "@/components/shell/sign-out-button";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = session?.user?.role;

  const navItems = [
    ...(role ? NAV_ITEMS.shared.filter((item) => item.href !== "/account") : []),
    ...(role ? NAV_ITEMS.pm : []),
    ...(role === "ADMIN" ? NAV_ITEMS.admin : []),
    ...(role ? NAV_ITEMS.shared.filter((item) => item.href === "/account") : []),
  ];

  return (
    <div className="min-h-screen bg-enshore-pattern">
      <div className="relative min-h-screen">
      <header className="border-b border-border/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <Link href="/" className="text-xl font-semibold tracking-tight text-foreground">
              {APP_NAME}
            </Link>
            <p className="text-sm text-muted-foreground">Customer feedback, action tracking, and executive visibility.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-secondary px-3 py-1 text-sm">{session?.user?.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2 rounded-[1.75rem] border border-border/80 bg-white p-4 shadow-[0_20px_40px_rgba(36,88,104,0.12)]">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </aside>
        <main className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_60px_rgba(10,53,70,0.14)]">
          {children}
        </main>
      </div>
      </div>
    </div>
  );
}
