"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changeOwnPassword } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ChangePasswordForm({ saved = false }: { saved?: boolean }) {
  const [state, formAction] = useFormState(changeOwnPassword, undefined);

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {saved ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Your password has been updated.
          </div>
        ) : null}
        {state?.error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {state.error}
          </div>
        ) : null}
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Current password</label>
            <Input name="currentPassword" type="password" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">New password</label>
            <Input name="newPassword" type="password" required minLength={8} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm new password</label>
            <Input name="confirmPassword" type="password" required minLength={8} />
          </div>
          <p className="text-sm text-muted-foreground">
            Passwords must be at least 8 characters long.
          </p>
          <ChangePasswordSubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}

function ChangePasswordSubmitButton() {
  const { pending } = useFormStatus();

  return <Button type="submit">{pending ? "Saving..." : "Update password"}</Button>;
}
