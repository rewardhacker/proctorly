import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { computeFlagStatus } from "@/lib/antiCheat";
import Notice from "@/components/Notice";
import GradingForm from "./GradingForm";
import AnnotatedPdfViewerClient from "./AnnotatedPdfViewerClient";
import TutorScanUpload from "./TutorScanUpload";

export default async function GradeAttemptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await auth();

  const attempt = await prisma.attempt.findFirst({
    where: { id, paper: { tutorId: session!.user.id } },
    include: {
      tutee: true,
      paper: true,
      answers: true,
      grade: true,
      focusEvents: { select: { type: true, durationMs: true } },
      activityLogs: { orderBy: { serverTimestamp: "asc" } },
    },
  });
  if (!attempt) notFound();

  const flagStatus = computeFlagStatus(attempt.focusEvents);

  const questionKeys = Array.from({ length: attempt.paper.numQuestions }, (_, i) => `q${i + 1}`);
  const questionAnswers = questionKeys.map((key) => {
    const answer = attempt.answers.find((a) => a.questionKey === key);
    const content = (answer?.richTextJson as JSONContent | null) ?? null;
    return { key, content, flagged: answer?.flagged ?? false };
  });
  const scans = attempt.answers.find((a) => a.questionKey === "scan")?.scanFileKeys ?? [];

  const studentAnnotationPages =
    (attempt.answers.find((a) => a.questionKey === "pdf")?.annotationJson as { pages?: Record<string, number[][][]> } | null)?.pages ?? {};
  const tutorAnnotationJson = attempt.tutorAnnotationJson as {
    pages?: Record<string, number[][][]>;
    highlightPages?: Record<string, number[][][]>;
    scanPages?: Record<string, Record<string, number[][][]>>;
    scanHighlightPages?: Record<string, Record<string, number[][][]>>;
  } | null;
  const tutorAnnotationPages = tutorAnnotationJson?.pages ?? {};
  const tutorHighlightPages = tutorAnnotationJson?.highlightPages ?? {};
  const tutorScanAnnotationPages = tutorAnnotationJson?.scanPages ?? {};
  const tutorScanHighlightPages = tutorAnnotationJson?.scanHighlightPages ?? {};

  const feedbackQuestions =
    (attempt.grade?.feedbackJson as { questions?: Record<string, { score: number; maxScore: number }> } | null)?.questions ?? {};

  const durationLabel = (() => {
    if (!attempt.startedAt || !attempt.submittedAt) return null;
    const ms = attempt.submittedAt.getTime() - attempt.startedAt.getTime();
    const totalMins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${totalMins}m ${secs}s`;
  })();

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-1 text-xl font-semibold">{attempt.paper.title}</h1>
      <p className="mb-1 text-sm text-gray-600">{attempt.tutee.name}</p>
      {durationLabel && (
        <p className="mb-4 text-sm text-gray-500">
          Time taken: <span className="font-medium">{durationLabel}</span>
          {attempt.autoSubmitted && " (auto-submitted)"}
        </p>
      )}
      <Notice error={error} />

      <div className={`mb-6 rounded border p-3 text-sm ${flagStatus.flagged ? "border-yellow-400 bg-yellow-50" : "border-gray-200"}`}>
        <p className="font-medium">
          {flagStatus.flagged ? "Flagged for review" : "No anti-cheat flags"}
        </p>
        <p className="text-gray-600">
          {flagStatus.switchCount} tab switch{flagStatus.switchCount === 1 ? "" : "es"},{" "}
          {Math.round(flagStatus.totalAwayMs / 1000)}s away,{" "}
          {flagStatus.copyPasteAttempts} copy/paste/right-click attempt{flagStatus.copyPasteAttempts === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Best-effort client-reported signal &ndash; absence of flags does not prove no tab-switching occurred.
        </p>
      </div>

      <details className="mb-6">
        <summary className="cursor-pointer text-sm font-medium text-gray-600">
          Dispute Log ({attempt.activityLogs.length + attempt.focusEvents.length} events)
        </summary>
        <ul className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
          {[...attempt.activityLogs.map((l) => ({ at: l.serverTimestamp, label: l.event }))]
            .sort((a, b) => a.at.getTime() - b.at.getTime())
            .map((e, i) => (
              <li key={i}>{e.at.toISOString()} &ndash; {e.label}</li>
            ))}
        </ul>
      </details>

      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium">Annotated Paper</h2>
        <a
          href={`/api/attempts/${attempt.id}/marked-pdf`}
          download
          className="rounded bg-foreground px-3 py-1.5 text-sm text-white hover:opacity-90"
        >
          Download PDF
        </a>
      </div>
      <AnnotatedPdfViewerClient
        attemptId={attempt.id}
        paperFileUrl={`/api/files/${attempt.paper.paperFileKey}`}
        markSchemeFileUrl={`/api/files/${attempt.paper.markSchemeFileKey}`}
        scanFileUrls={scans.map((key) => ({ key, url: `/api/files/${key}` }))}
        studentAnnotationPages={studentAnnotationPages as Record<string, [number, number][][]>}
        initialTutorAnnotationPages={tutorAnnotationPages as Record<string, [number, number][][]>}
        initialTutorHighlightPages={tutorHighlightPages as Record<string, [number, number][][]>}
        initialScanAnnotationPages={tutorScanAnnotationPages as Record<string, Record<string, [number, number][][]>>}
        initialScanHighlightPages={tutorScanHighlightPages as Record<string, Record<string, [number, number][][]>>}
      />

      <TutorScanUpload attemptId={attempt.id} />

      <h2 className="mb-2 font-medium">Answers &amp; Marks</h2>
      <GradingForm
        attemptId={attempt.id}
        questionKeys={questionKeys}
        questionAnswers={questionAnswers}
        hasGrade={!!attempt.grade}
        existingComment={attempt.grade?.overallComment ?? null}
        existingPerQuestion={Object.fromEntries(
          questionKeys.map((k) => [k, {
            score: feedbackQuestions[k]?.score ?? null,
            maxScore: feedbackQuestions[k]?.maxScore ?? null,
          }])
        )}
      />
    </main>
  );
}
