"use client";

import { useRef, useState } from "react";
import { beginTutorScanUpload, finalizeTutorScanUpload } from "@/lib/actions";
import { MAX_FILE_BYTES } from "@/lib/storage/validate";

export default function TutorScanUpload({ attemptId }: { attemptId: string }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        setError(`${file.name} is over the 10MB limit.`);
        setStatus("error");
        return;
      }
    }

    setError(null);
    setStatus("uploading");
    try {
      const uploads = await beginTutorScanUpload(
        attemptId,
        files.map((f) => ({ name: f.name, contentType: f.type || "application/pdf" })),
      );

      await Promise.all(
        uploads.map(({ uploadUrl }, i) =>
          fetch(uploadUrl, {
            method: "PUT",
            body: files[i],
            headers: { "Content-Type": files[i].type || "application/pdf" },
          }),
        ),
      );

      await finalizeTutorScanUpload(attemptId, uploads.map((u) => u.key));
      setStatus("done");
      if (inputRef.current) inputRef.current.value = "";
    } catch {
      setError("Upload failed – try again");
      setStatus("error");
    }
  }

  return (
    <div className="mb-6">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded bg-foreground px-3 py-1.5 text-sm text-white hover:opacity-90">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,application/pdf,application/octet-stream"
          multiple
          className="hidden"
          onChange={onChange}
        />
        Upload Scan
      </label>
      <p className="mt-1 text-xs text-gray-500">
        {status === "uploading"
          ? "Uploading…"
          : status === "done"
            ? "Uploaded — refresh to see it in the viewer"
            : status === "error"
              ? error
              : ""}
      </p>
    </div>
  );
}
