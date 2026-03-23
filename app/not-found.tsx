import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-lg rounded-[2rem] border border-border/80 bg-white p-10 text-center shadow-sm">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Enshore Insight</p>
        <h1 className="mt-4 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          The page you requested does not exist, or the project form is not currently active.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
