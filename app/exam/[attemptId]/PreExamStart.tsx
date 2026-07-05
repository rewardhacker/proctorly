"use client";

import { useState } from "react";
import { startAttempt } from "@/lib/actions";

export default function PreExamStart({ attemptId }: { attemptId: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded bg-foreground px-4 py-2 text-white"
      >
        Start Exam
      </button>
    );
  }

  return (
    <div className="rounded border border-yellow-400 bg-yellow-50 p-4">
      <p className="mb-3 text-sm font-medium">
        Once you press Start, the timer begins immediately and cannot be
        paused, stopped, or restarted for any reason &ndash; including
        technical issues. Are you ready to begin?
      </p>
      <div className="flex gap-3">
        <form action={() => startAttempt(attemptId)}>
          <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
            Yes, Start Now
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded border px-4 py-2"
        >
          Not Yet
        </button>
      </div>
    </div>
  );
}
