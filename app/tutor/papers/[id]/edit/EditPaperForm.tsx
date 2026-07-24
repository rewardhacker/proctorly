"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { beginPaperUpload, updatePaper } from "@/lib/actions";
import { MAX_FILE_BYTES } from "@/lib/storage/validate";
import FileInputButton from "@/components/FileInputButton";

type Props = {
  paper: {
    id: string;
    title: string;
    subject: string | null;
    paperVariant: string | null;
    defaultDurationMins: number;
    numQuestions: number;
  };
};

export default function EditPaperForm({ paper }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const paperFile = formData.get("paperFile") as File | null;
    const markSchemeFile = formData.get("markSchemeFile") as File | null;

    for (const file of [paperFile, markSchemeFile]) {
      if (!file || file.size === 0) continue;
      if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return; }
      if (file.size > MAX_FILE_BYTES) { setError("Each file must be 10MB or smaller."); return; }
    }

    setSaving(true);
    try {
      const payload: Parameters<typeof updatePaper>[0] = {
        id: paper.id,
        title: formData.get("title") as string,
        subject: (formData.get("subject") as string) || null,
        paperVariant: (formData.get("paperVariant") as string) || null,
        defaultDurationMins: Number(formData.get("defaultDurationMins")),
        numQuestions: Math.max(1, Number(formData.get("numQuestions")) || 1),
      };

      const needsUpload = (paperFile && paperFile.size > 0) || (markSchemeFile && markSchemeFile.size > 0);
      if (needsUpload) {
        const { paperFileKey, paperUploadUrl, markSchemeFileKey, markSchemeUploadUrl } =
          await beginPaperUpload(
            (paperFile && paperFile.size > 0) ? paperFile.type : "application/pdf",
            (markSchemeFile && markSchemeFile.size > 0) ? markSchemeFile.type : "application/pdf",
          );

        const uploads: Promise<Response>[] = [];
        if (paperFile && paperFile.size > 0) {
          uploads.push(fetch(paperUploadUrl, { method: "PUT", body: paperFile, headers: { "Content-Type": paperFile.type } }));
          payload.paperFileKey = paperFileKey;
          payload.paperFileSize = paperFile.size;
        }
        if (markSchemeFile && markSchemeFile.size > 0) {
          uploads.push(fetch(markSchemeUploadUrl, { method: "PUT", body: markSchemeFile, headers: { "Content-Type": markSchemeFile.type } }));
          payload.markSchemeFileKey = markSchemeFileKey;
          payload.markSchemeFileSize = markSchemeFile.size;
        }
        await Promise.all(uploads);
      }

      const result = await updatePaper(payload);
      if ("error" in result) { setError(result.error); setSaving(false); return; }

      router.push(`/tutor/papers?success=${encodeURIComponent(`"${payload.title}" was updated.`)}`);
    } catch {
      setError("Could not save changes. Please try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input name="title" defaultValue={paper.title} placeholder="Title" required className="rounded border px-3 py-2" />
      <input name="subject" defaultValue={paper.subject ?? ""} placeholder="Subject (optional, e.g. Maths GCSE)" className="rounded border px-3 py-2" />
      <input name="paperVariant" defaultValue={paper.paperVariant ?? ""} placeholder="Paper variant (optional, e.g. Calculator / Non-Calculator)" className="rounded border px-3 py-2" />
      <input
        name="defaultDurationMins"
        type="number"
        defaultValue={paper.defaultDurationMins}
        placeholder="Duration (minutes)"
        required
        className="rounded border px-3 py-2"
      />
      <input
        name="numQuestions"
        type="number"
        min={1}
        defaultValue={paper.numQuestions}
        placeholder="Number of questions"
        className="rounded border px-3 py-2"
      />
      <FileInputButton name="paperFile" accept="application/pdf" label="Replace Exam Paper (optional, PDF, max 10MB)" />
      <FileInputButton name="markSchemeFile" accept="application/pdf" label="Replace Mark Scheme (optional, PDF, max 10MB)" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="rounded bg-foreground px-4 py-2 text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
