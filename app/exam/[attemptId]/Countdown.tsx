"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Status = "PENDING" | "IN_PROGRESS" | "UPLOAD_BUFFER" | "SUBMITTED" | "GRADED" | "VOIDED";

function format(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WARNINGS = [
  { ms: 10 * 60 * 1000, label: "10 minutes remaining!", color: "bg-yellow-50 border-yellow-400 text-yellow-800" },
  { ms: 5 * 60 * 1000, label: "5 minutes remaining!", color: "bg-orange-50 border-orange-400 text-orange-800" },
  { ms: 60 * 1000, label: "1 minute remaining!", color: "bg-red-50 border-red-500 text-red-800" },
];

export default function Countdown({
  attemptId,
  status,
}: {
  attemptId: string;
  status: Status;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [warning, setWarning] = useState<{ label: string; color: string } | null>(null);
  const offsetRef = useRef(0);
  const targetRef = useRef<number | null>(null);
  const lastStatusRef = useRef(status);
  const firedWarningsRef = useRef(new Set<number>());

  useEffect(() => {
    let stopped = false;

    async function poll() {
      const res = await fetch(`/api/attempts/${attemptId}/status`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (stopped) return;

      offsetRef.current = new Date(data.serverNow).getTime() - Date.now();
      targetRef.current = data.status === "IN_PROGRESS"
        ? new Date(data.hardEndAt).getTime()
        : data.status === "UPLOAD_BUFFER"
          ? new Date(data.bufferEndAt).getTime()
          : null;

      if (data.status !== lastStatusRef.current) {
        lastStatusRef.current = data.status;
        router.refresh();
      }
    }

    poll();
    const pollId = setInterval(poll, 5000);

    const tickId = setInterval(() => {
      if (targetRef.current == null) {
        setLabel("");
        return;
      }
      const serverNow = Date.now() + offsetRef.current;
      const remaining = targetRef.current - serverNow;
      setLabel(format(remaining));

      // fire each warning once when we cross below its threshold
      if (lastStatusRef.current === "IN_PROGRESS") {
        for (const w of WARNINGS) {
          if (remaining <= w.ms && !firedWarningsRef.current.has(w.ms)) {
            firedWarningsRef.current.add(w.ms);
            setWarning({ label: w.label, color: w.color });
            setTimeout(() => setWarning(null), 8000);
          }
        }
      }
    }, 1000);

    return () => {
      stopped = true;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, [attemptId, router]);

  return (
    <>
      {warning && (
        <div className={`mb-4 rounded border px-4 py-3 text-sm font-semibold ${warning.color}`}>
          ⏰ {warning.label}
        </div>
      )}
      {label && (
        <p className="mb-4 text-lg font-semibold">
          {status === "UPLOAD_BUFFER" ? "Upload buffer: " : "Time remaining: "}
          {label}
        </p>
      )}
    </>
  );
}
