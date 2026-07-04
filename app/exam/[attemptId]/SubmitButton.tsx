"use client";

import { submitAttempt } from "@/lib/actions";

export default function SubmitButton({ attemptId, label }: { attemptId: string; label: string }) {
  return (
    <form
      action={() => submitAttempt(attemptId)}
      onSubmit={(e) => {
        if (!confirm("Are you sure you want to submit? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
        {label}
      </button>
    </form>
  );
}
