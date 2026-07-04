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

export default function Countdown({
  attemptId,
  status,
}: {
  attemptId: string;
  status: Status;
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const offsetRef = useRef(0); // serverNow - Date.now(), ms
  const targetRef = useRef<number | null>(null);
  const lastStatusRef = useRef(status);

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
      setLabel(format(targetRef.current - serverNow));
    }, 1000);

    return () => {
      stopped = true;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, [attemptId, router]);

  if (!label) return null;

  return (
    <p className="mb-4 text-lg font-semibold">
      {status === "UPLOAD_BUFFER" ? "Upload buffer: " : "Time remaining: "}
      {label}
    </p>
  );
}
