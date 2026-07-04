"use client";

import { toggleFlag } from "@/lib/actions";

export default function FlagButton({
  attemptId,
  questionKey,
  flagged,
}: {
  attemptId: string;
  questionKey: string;
  flagged: boolean;
}) {
  return (
    <form action={() => toggleFlag(attemptId, questionKey)}>
      <button
        type="submit"
        className={`rounded border px-2 py-1 text-xs ${flagged ? "bg-yellow-200" : ""}`}
      >
        {flagged ? "Flagged" : "Flag for review"}
      </button>
    </form>
  );
}
