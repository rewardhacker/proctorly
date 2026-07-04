import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { gradeAttempt } from "@/lib/actions";
import { computeFlagStatus } from "@/lib/antiCheat";
import AnswerView from "./AnswerView";

export default async function GradeAttemptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const attempt = await prisma.attempt.findFirst({
    where: { id, paper: { tutorId: session.user.id } },
    include: {
      tutee: true,
      paper: true,
      answers: true,
      grade: true,
      focusEvents: { orderBy: { serverReceivedAt: "asc" } },
      activityLogs: { orderBy: { serverTimestamp: "asc" } },
    },
  });
  if (!attempt) notFound();

  const flagStatus = computeFlagStatus(attempt.focusEvents);

  const questionAnswers = Array.from({ length: attempt.paper.numQuestions }, (_, i) => {
    const key = `q${i + 1}`;
    const answer = attempt.answers.find((a) => a.questionKey === key);
    const content = (answer?.richTextJson as JSONContent | null) ?? null;
    return { key, content, flagged: answer?.flagged ?? false };
  });
  const scans = attempt.answers.find((a) => a.questionKey === "scan")?.scanFileKeys ?? [];

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-1 text-xl font-semibold">{attempt.paper.title}</h1>
      <p className="mb-4 text-sm text-gray-600">{attempt.tutee.name}</p>

      <div
        className={`mb-6 rounded border p-3 text-sm ${flagStatus.flagged ? "border-yellow-400 bg-yellow-50" : "border-gray-200"}`}
      >
        <p className="font-medium">
          {flagStatus.flagged ? "Flagged for review" : "No anti-cheat flags"}
        </p>
        <p className="text-gray-600">
          {flagStatus.switchCount} tab switch{flagStatus.switchCount === 1 ? "" : "es"},{" "}
          {Math.round(flagStatus.totalAwayMs / 1000)}s away,{" "}
          {flagStatus.copyPasteAttempts} copy/paste/right-click attempt
          {flagStatus.copyPasteAttempts === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Best-effort client-reported signal &mdash; absence of flags does not
          prove no tab-switching occurred.
        </p>
      </div>

      <details className="mb-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-600">
          Dispute log ({attempt.activityLogs.length + attempt.focusEvents.length} events)
        </summary>
        <ul className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
          {[...attempt.activityLogs.map((l) => ({ at: l.serverTimestamp, label: l.event })),
            ...attempt.focusEvents.map((f) => ({
              at: f.serverReceivedAt,
              label: f.durationMs ? `${f.type} (${f.durationMs}ms)` : f.type,
            }))]
            .sort((a, b) => a.at.getTime() - b.at.getTime())
            .map((e, i) => (
              <li key={i}>
                {e.at.toISOString()} &mdash; {e.label}
              </li>
            ))}
        </ul>
      </details>

      <h2 className="mb-2 font-medium">Answers</h2>
      <div className="mb-6 flex flex-col gap-3">
        {questionAnswers.map((qa) => (
          <div key={qa.key}>
            <p className="mb-1 text-xs font-medium text-gray-500">
              {qa.key.toUpperCase()} {qa.flagged && "(flagged by student)"}
            </p>
            <AnswerView content={qa.content} />
          </div>
        ))}
        {scans.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Uploaded scans</p>
            <div className="flex flex-col gap-1">
              {scans.map((key) => (
                <a key={key} href={`/api/files/${key}`} target="_blank" className="underline">
                  {key.split("/").pop()}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <h2 className="mb-2 font-medium">Grade</h2>
      <form action={gradeAttempt} className="flex flex-col gap-3">
        <input type="hidden" name="attemptId" value={attempt.id} />
        <div className="flex gap-3">
          <input
            name="score"
            type="number"
            step="0.5"
            placeholder="Score"
            defaultValue={attempt.grade?.score?.toString()}
            required
            className="w-1/2 rounded border px-3 py-2"
          />
          <input
            name="maxScore"
            type="number"
            step="0.5"
            placeholder="Max score"
            defaultValue={attempt.grade?.maxScore?.toString()}
            required
            className="w-1/2 rounded border px-3 py-2"
          />
        </div>
        <textarea
          name="overallComment"
          placeholder="Feedback"
          defaultValue={attempt.grade?.overallComment ?? ""}
          rows={4}
          className="rounded border p-3"
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          {attempt.grade ? "Update grade" : "Submit grade"}
        </button>
      </form>
    </main>
  );
}
