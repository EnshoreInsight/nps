import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <div className="inline-flex rounded-full bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground">
            Enshore Insight
          </div>
          <h1 className="text-5xl font-semibold tracking-tight text-foreground">
            Turn customer feedback into accountable action across every Enshore project.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Collect public project feedback, trigger urgency-aware notifications, and give PMs and executives one trusted operating view.
          </p>
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </section>
        <Card className="bg-[radial-gradient(circle_at_top_left,_rgba(242,169,59,0.18),_transparent_40%),linear-gradient(180deg,#0b3948,#0d525e)] text-white">
          <CardContent className="space-y-6 p-8">
            <p className="text-sm uppercase tracking-[0.2em] text-white/70">Operating model</p>
            <div className="grid gap-4">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-white/70">Public feedback forms</p>
                <p className="mt-2 text-2xl font-semibold">Project-specific submission experience</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-white/70">Urgency and SLA engine</p>
                <p className="mt-2 text-2xl font-semibold">Automatic triage and notification routing</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-sm text-white/70">Role-based dashboards</p>
                <p className="mt-2 text-2xl font-semibold">Project manager and CEO visibility from one source</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
