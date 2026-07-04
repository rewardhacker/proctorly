"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { beginPaperUpload, finalizeCreatePaper } from "@/lib/actions";
import { MAX_FILE_BYTES } from "@/lib/storage/validate";
import FileInputButton from "@/components/FileInputButton";

export default function NewPaperForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const subject = (formData.get("subject") as string) || null;
    const defaultDurationMins = Number(formData.get("defaultDurationMins"));
    const numQuestions = Math.max(1, Number(formData.get("numQuestions")) || 1);
    const paperFile = formData.get("paperFile") as File;
    const markSchemeFile = formData.get("markSchemeFile") as File;

    for (const file of [paperFile, markSchemeFile]) {
      if (!file || file.size === 0) {
        setError("Please choose both files.");
        return;
      }
      if (file.type !== "application/pdf") {
        setError("Only PDF files are accepted.");
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("Each file must be 10MB or smaller.");
        return;
      }
    }

    setUploading(true);
    try {
      const { paperFileKey, paperUploadUrl, markSchemeFileKey, markSchemeUploadUrl } =
        await beginPaperUpload(paperFile.type, markSchemeFile.type);

      await Promise.all([
        fetch(paperUploadUrl, {
          method: "PUT",
          body: paperFile,
          headers: { "Content-Type": paperFile.type },
        }),
        fetch(markSchemeUploadUrl, {
          method: "PUT",
          body: markSchemeFile,
          headers: { "Content-Type": markSchemeFile.type },
        }),
      ]);

      const result = await finalizeCreatePaper({
        title,
        subject,
        defaultDurationMins,
        numQuestions,
        paperFileKey,
        paperFileSize: paperFile.size,
        markSchemeFileKey,
        markSchemeFileSize: markSchemeFile.size,
      });

      if ("error" in result) {
        setError(result.error);
        setUploading(false);
        return;
      }

      router.push(`/tutor/papers?success=${encodeURIComponent(`"${title}" was uploaded.`)}`);
    } catch {
      setError("Could not upload paper. Please try again.");
      setUploading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input name="title" placeholder="Title" required className="rounded border px-3 py-2" />
      <input name="subject" placeholder="Subject (optional)" className="rounded border px-3 py-2" />
      <input
        name="defaultDurationMins"
        type="number"
        placeholder="Duration (minutes)"
        required
        className="rounded border px-3 py-2"
      />
      <input
        name="numQuestions"
        type="number"
        min={1}
        defaultValue={1}
        placeholder="Number of questions"
        className="rounded border px-3 py-2"
      />
      <FileInputButton
        name="paperFile"
        accept="application/pdf"
        required
        label="Exam Paper (PDF, max 10MB)"
      />
      <FileInputButton
        name="markSchemeFile"
        accept="application/pdf"
        required
        label="Mark Scheme (PDF, max 10MB)"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={uploading}
        className="rounded bg-foreground px-4 py-2 text-white disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
