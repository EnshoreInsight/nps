"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isPending}
      aria-disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await signOut({ redirect: false });
          router.push("/sign-in");
          router.refresh();
        });
      }}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </Button>
  );
}
