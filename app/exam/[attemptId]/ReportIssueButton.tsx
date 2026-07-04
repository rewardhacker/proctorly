"use client";

import { useState } from "react";
import { reportIssue } from "@/lib/actions";

export default function ReportIssueButton({ attemptId }: { attemptId: string }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="text-sm text-green-700">Your tutor has been emailed.</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-red-400 px-3 py-1 text-sm text-red-700"
      >
        Report issue
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await reportIssue(attemptId, (formData.get("message") as string) || "");
        setSent(true);
      }}
      className="flex flex-col gap-2 rounded border border-red-300 p-3"
    >
      <p className="text-sm">
        Use this only for a genuine hardware/system failure. Your tutor is
        emailed immediately.
      </p>
      <textarea
        name="message"
        placeholder="Briefly describe what's wrong"
        rows={2}
        className="rounded border p-2 text-sm"
      />
      <div className="flex gap-2">
        <button type="submit" className="rounded bg-red-700 px-3 py-1 text-sm text-white">
          Send now
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border px-3 py-1 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
