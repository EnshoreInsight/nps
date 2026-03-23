import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SignInForm } from "@/components/forms/sign-in-form";

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Enshore Insight</CardTitle>
          <CardDescription>Use one of the seeded accounts or your provisioned internal login.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm />
        </CardContent>
      </Card>
    </main>
  );
}
