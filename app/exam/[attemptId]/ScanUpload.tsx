"use client";

import { useState } from "react";
import { beginScanUpload, finalizeScanUpload } from "@/lib/actions";
import { MAX_FILE_BYTES } from "@/lib/storage/validate";
import FileInputButton from "@/components/FileInputButton";

export default function ScanUpload({ attemptId }: { attemptId: string }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

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
      const uploads = await beginScanUpload(
        attemptId,
        files.map((f) => ({ name: f.name, contentType: f.type })),
      );

      await Promise.all(
        uploads.map(({ uploadUrl }, i) =>
          fetch(uploadUrl, {
            method: "PUT",
            body: files[i],
            headers: { "Content-Type": files[i].type },
          }),
        ),
      );

      await finalizeScanUpload(
        attemptId,
        uploads.map((u) => u.key),
      );
      setStatus("done");
    } catch {
      setError("Upload failed – try again");
      setStatus("error");
    }
  }

  return (
    <div>
      <FileInputButton
        name="scans"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        label="Answer Photos"
        onChange={onChange}
      />
      <p className="mt-1 text-xs text-gray-500">
        {status === "uploading"
          ? "Uploading…"
          : status === "done"
            ? "Uploaded"
            : status === "error"
              ? error
              : ""}
      </p>
    </div>
  );
}
