"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function FeedbackSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="rounded-full px-8"
      disabled={pending}
      aria-disabled={pending}
    >
      {pending ? "Submitting..." : "Submit feedback"}
    </Button>
  );
}
