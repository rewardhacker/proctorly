"use client";

import { useState } from "react";
import { uploadScans } from "@/lib/actions";

export default function ScanUpload({ attemptId }: { attemptId: string }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setStatus("uploading");
    const formData = new FormData();
    for (const file of Array.from(e.target.files)) formData.append("scans", file);
    try {
      await uploadScans(attemptId, formData);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        onChange={onChange}
      />
      <p className="mt-1 text-xs text-gray-500">
        {status === "uploading"
          ? "Uploading…"
          : status === "done"
            ? "Uploaded"
            : status === "error"
              ? "Upload failed — try again"
              : ""}
      </p>
    </div>
  );
}
