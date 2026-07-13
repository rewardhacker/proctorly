"use client";

import { useState } from "react";
import { beginScanUpload, finalizeScanUpload } from "@/lib/actions";
import { MAX_FILE_BYTES } from "@/lib/storage/validate";
import FileInputButton from "@/components/FileInputButton";

export default function ScanUpload({
  attemptId,
  existingCount = 0,
  uploadedAt,
}: {
  attemptId: string;
  existingCount?: number;
  uploadedAt?: string;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [lastUploadedAt, setLastUploadedAt] = useState<string | undefined>(uploadedAt);
  const [fileCount, setFileCount] = useState(existingCount);

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

      await finalizeScanUpload(attemptId, uploads.map((u) => u.key));
      setFileCount(files.length);
      setLastUploadedAt(new Date().toISOString());
      setStatus("done");
    } catch {
      setError("Upload failed – try again");
      setStatus("error");
    }
  }

  const hasExisting = fileCount > 0;

  return (
    <div>
      {hasExisting && status !== "done" && (
        <p className="mb-2 text-sm text-green-700">
          {fileCount} file{fileCount === 1 ? "" : "s"} uploaded
          {lastUploadedAt && (
            <> · <span className="text-gray-500">Last uploaded {new Date(lastUploadedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></>
          )}
        </p>
      )}
      <FileInputButton
        name="scans"
        accept="image/jpeg,image/png,application/pdf"
        multiple
        label={hasExisting ? "Re-upload Scans (replaces current)" : "Upload Answer Scans"}
        onChange={onChange}
      />
      <p className="mt-1 text-xs text-gray-500">
        {status === "uploading"
          ? "Uploading…"
          : status === "done"
            ? `${fileCount} file${fileCount === 1 ? "" : "s"} uploaded · ${new Date(lastUploadedAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : status === "error"
              ? error
              : ""}
      </p>
    </div>
  );
}
