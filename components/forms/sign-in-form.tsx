"use client";

import { useFormState } from "react-dom";
import { authenticate } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SignInForm() {
  const [state, formAction] = useFormState(authenticate, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Email</label>
        <Input name="email" type="email" placeholder="name@enshore.com" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Password</label>
        <Input name="password" type="password" placeholder="••••••••" required />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" className="w-full">
        Sign in
      </Button>
    </form>
  );
}
