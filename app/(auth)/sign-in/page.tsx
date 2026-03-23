import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/forms/sign-in-form";

export default function SignInPage() {
  return (
    <main className="bg-enshore-pattern">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md border-white/70 bg-white/92 shadow-[0_24px_60px_rgba(10,53,70,0.16)] backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Sign in to Enshore Insight</CardTitle>
            <CardDescription>Use one of the seeded accounts or your provisioned internal login.</CardDescription>
          </CardHeader>
          <CardContent>
            <SignInForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
