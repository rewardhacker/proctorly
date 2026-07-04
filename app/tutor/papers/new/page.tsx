import { createPaper } from "@/lib/actions";

export default function NewPaperPage() {
  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Upload a paper</h1>
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
        <label className="flex flex-col gap-1 text-sm">
          Exam paper (PDF, max 10MB)
          <input name="paperFile" type="file" accept="application/pdf" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mark scheme (PDF, max 10MB)
          <input name="markSchemeFile" type="file" accept="application/pdf" required />
        </label>
        <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
          Upload
        </button>
      </form>
    </main>
  );
}
