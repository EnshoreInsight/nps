"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Role } from "@prisma/client";
import { createUser, updateUser } from "@/app/actions";
import { DEFAULT_NEW_USER_PASSWORD } from "@/lib/constants";
import { CORE_USER_EMAIL } from "@/lib/core-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type UserFormValues = {
  id?: string;
  name?: string;
  email?: string;
  role?: Role;
  addToAllProjects?: "YES" | "NO";
};

export function UserForm({
  mode = "create",
  user,
}: {
  mode?: "create" | "edit";
  user?: UserFormValues;
}) {
  const isEdit = mode === "edit";
  const isProtectedCoreUser = !!user?.email && user.email.toLowerCase() === CORE_USER_EMAIL;
  const [state, formAction] = useFormState(isEdit ? updateUser : createUser, undefined);

  return (
    <Card>
      <CardContent className="p-6">
        <form action={formAction} className="space-y-4">
          {isEdit ? <input type="hidden" name="userId" value={user?.id} /> : null}
          {state?.error ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {state.error}
            </div>
          ) : null}
          <div className="space-y-2">
            <label className="text-sm font-medium">Full name</label>
            <Input
              name="name"
              placeholder="Full name"
              required
              defaultValue={user?.name ?? ""}
              readOnly={isProtectedCoreUser}
              className={isProtectedCoreUser ? "bg-slate-100 text-slate-500" : undefined}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Email address</label>
            <Input
              name="email"
              type="email"
              placeholder="name@enshore.com"
              required
              defaultValue={user?.email ?? ""}
              readOnly={isProtectedCoreUser}
              className={isProtectedCoreUser ? "bg-slate-100 text-slate-500" : undefined}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{isEdit ? "Reset password" : "Temporary password"}</label>
            <Input
              name="password"
              type="password"
              defaultValue={isEdit ? undefined : DEFAULT_NEW_USER_PASSWORD}
              placeholder={isEdit ? "Leave blank to keep current password" : DEFAULT_NEW_USER_PASSWORD}
              required={!isEdit}
              readOnly={!isEdit}
            />
            {!isEdit ? (
              <p className="text-sm text-muted-foreground">
                New users start with the default password <span className="font-medium text-foreground">{DEFAULT_NEW_USER_PASSWORD}</span> and can change it from the Account page after signing in.
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <select
              name="role"
              className={`h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm ${isProtectedCoreUser ? "bg-slate-100 text-slate-500" : ""}`}
              required
              defaultValue={user?.role ?? ""}
              disabled={isProtectedCoreUser}
            >
              <option value="">Select role</option>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {isProtectedCoreUser ? <input type="hidden" name="role" value={Role.ADMIN} /> : null}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Add to all projects</label>
            <select
              name="addToAllProjects"
              className={`h-11 w-full rounded-2xl border border-input bg-white px-4 text-sm ${isProtectedCoreUser ? "bg-slate-100 text-slate-500" : ""}`}
              defaultValue={user?.addToAllProjects ?? "NO"}
              disabled={isProtectedCoreUser}
            >
              <option value="NO">No</option>
              <option value="YES">Yes</option>
            </select>
            {isProtectedCoreUser ? <input type="hidden" name="addToAllProjects" value="NO" /> : null}
            <p className="text-sm text-muted-foreground">
              Choosing yes creates project access entries across all projects with no notification levels selected.
            </p>
          </div>
          {isProtectedCoreUser ? (
            <p className="text-sm text-muted-foreground">
              This is the protected Enshore Insight core admin account. Its name, email, and role are fixed.
            </p>
          ) : null}
          <UserSubmitButton isEdit={isEdit} />
        </form>
      </CardContent>
    </Card>
  );
}

function UserSubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return <Button type="submit">{pending ? (isEdit ? "Saving..." : "Creating...") : isEdit ? "Save changes" : "Create user"}</Button>;
}
