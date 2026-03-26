"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function DeleteSubmissionButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("Delete this received form and its linked action history? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      {pending ? "Deleting..." : "Delete form"}
    </Button>
  );
}
