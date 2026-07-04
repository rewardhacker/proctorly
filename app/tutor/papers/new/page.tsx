import { createPaper } from "@/lib/actions";
import Notice from "@/components/Notice";
import FileInputButton from "@/components/FileInputButton";

export default async function NewPaperPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Upload a Paper</h1>
      <Notice error={error} />
      <form action={createPaper} className="flex flex-col gap-3">
        <input
          name="title"
          placeholder="Title"
          required
          className="rounded border px-3 py-2"
        />
        <input
          name="subject"
          placeholder="Subject (optional)"
          className="rounded border px-3 py-2"
        />
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
        <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
          Upload
        </button>
      </form>
    </main>
  );
}
