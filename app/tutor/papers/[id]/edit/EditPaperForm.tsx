"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updatePaper } from "@/lib/actions";

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

    setSaving(true);
    const result = await updatePaper({
      id: paper.id,
      title: formData.get("title") as string,
      subject: (formData.get("subject") as string) || null,
      paperVariant: (formData.get("paperVariant") as string) || null,
      defaultDurationMins: Number(formData.get("defaultDurationMins")),
      numQuestions: Math.max(1, Number(formData.get("numQuestions")) || 1),
    });
    setSaving(false);

    if ("error" in result) {
      setError(result.error);
      return;
    }

    router.push(`/tutor/papers?success=${encodeURIComponent(`"${formData.get("title")}" was updated.`)}`);
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
