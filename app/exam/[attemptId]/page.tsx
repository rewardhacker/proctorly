import type { JSONContent } from "@tiptap/react";
import { prisma } from "@/lib/prisma";
import { getTuteeSession } from "@/lib/tuteeSession";
import { redirect, notFound } from "next/navigation";
import { resolveAttemptState } from "@/lib/timer/resolveAttemptState";
import AnswerEditor from "./AnswerEditor";
import FlagButton from "./FlagButton";
import Countdown from "./Countdown";
import ScanUpload from "./ScanUpload";
import SubmitButton from "./SubmitButton";
import PdfAnnotator from "./PdfAnnotatorClient";
import PreExamStart from "./PreExamStart";
import FocusTracker from "./FocusTracker";
import ReportIssueButton from "./ReportIssueButton";
import Link from "next/link";
import StudentPaperReviewClient from "./StudentPaperReviewClient";
import AnswerView from "./AnswerViewClient";

export default async function ExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { attemptId } = await params;
  const { q } = await searchParams;
  const tutee = await getTuteeSession();
  if (!tutee) redirect("/");

  const attemptRaw = await prisma.attempt.findFirst({
    where: { id: attemptId, tuteeId: tutee.tuteeId },
    include: { paper: true, answers: true, grade: true },
  });
  if (!attemptRaw) notFound();

  const resolved = await resolveAttemptState(attemptRaw);
  const attempt = resolved.status === attemptRaw.status ? attemptRaw : { ...attemptRaw, ...resolved };

  if (attempt.status === "PENDING") {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-4 text-xl font-semibold">{attempt.paper.title}</h1>
        <div className="mb-4 flex h-64 flex-col items-center justify-center gap-2 rounded border-2 border-dashed bg-gray-50 text-gray-400">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="5" y="11" width="14" height="9" rx="1" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <p className="text-sm">Paper locked until you start</p>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          Duration: {attempt.paper.defaultDurationMins} minutes, plus a{" "}
          {attempt.bufferSecs}s upload buffer at the end.{" "}
          {attempt.paper.numQuestions > 1 && `${attempt.paper.numQuestions} questions. `}
          Once you start, the timer cannot be paused.
        </p>
        <PreExamStart attemptId={attempt.id} />
      </main>
    );
  }

  if (attempt.status === "IN_PROGRESS") {
    const numQuestions = attempt.paper.numQuestions;
    const currentQ = Math.min(Math.max(Number(q) || 1, 1), numQuestions);
    const questionKey = `q${currentQ}`;
    const existing = attempt.answers.find((a) => a.questionKey === questionKey);
    const initialContent = (existing?.richTextJson as JSONContent | null) ?? null;
    const annotation = attempt.answers.find((a) => a.questionKey === "pdf");
    const initialPages =
      (annotation?.annotationJson as { pages?: Record<string, number[][][]> } | null)?.pages ?? {};

    return (
      <main className="mx-auto max-w-3xl select-none p-8">
        <FocusTracker attemptId={attempt.id} />
        <h1 className="mb-2 text-xl font-semibold">{attempt.paper.title}</h1>
        <Countdown attemptId={attempt.id} status={attempt.status} />

        {numQuestions > 1 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: numQuestions }, (_, i) => i + 1).map((n) => {
              const a = attempt.answers.find((x) => x.questionKey === `q${n}`);
              return (
                <Link
                  key={n}
                  href={`/exam/${attempt.id}?q=${n}`}
                  className={`rounded border px-3 py-1 text-sm ${
                    n === currentQ ? "bg-foreground text-white" : a?.flagged ? "bg-yellow-200" : a ? "bg-gray-200" : ""
                  }`}
                >
                  Q{n}
                </Link>
              );
            })}
          </div>
        )}

        <PdfAnnotator
          attemptId={attempt.id}
          fileUrl={`/api/files/${attempt.paper.paperFileKey}`}
          initialPages={initialPages as Record<string, [number, number][][]>}
        />

        <div className="mb-2 flex justify-end">
          <FlagButton attemptId={attempt.id} questionKey={questionKey} flagged={!!existing?.flagged} />
        </div>
        <AnswerEditor
          key={questionKey}
          attemptId={attempt.id}
          questionKey={questionKey}
          initialContent={initialContent}
        />

        <div className="mt-4 flex items-center justify-between">
          <SubmitButton attemptId={attempt.id} label="Submit" />
          <ReportIssueButton attemptId={attempt.id} />
        </div>
      </main>
    );
  }

  if (attempt.status === "UPLOAD_BUFFER") {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h1 className="mb-2 text-xl font-semibold">{attempt.paper.title}</h1>
        <Countdown attemptId={attempt.id} status={attempt.status} />
        <p className="mb-4 text-sm text-gray-600">
          Time&apos;s up for typed answers. If you wrote your answers on
          paper, upload photos now before the buffer runs out.
        </p>
        <ScanUpload attemptId={attempt.id} />
        <div className="mt-4 flex items-center justify-between">
          <SubmitButton attemptId={attempt.id} label="Submit Now" />
          <ReportIssueButton attemptId={attempt.id} />
        </div>
      </main>
    );
  }

  const studentAnnotationPages =
    (attempt.answers.find((a) => a.questionKey === "pdf")?.annotationJson as { pages?: Record<string, number[][][]> } | null)?.pages ?? {};
  const tutorAnnotationPages =
    (attempt.tutorAnnotationJson as { pages?: Record<string, number[][][]> } | null)?.pages ?? {};
  const feedbackQuestions =
    (attempt.grade?.feedbackJson as { questions?: Record<string, { score: number; maxScore: number }> } | null)?.questions ?? {};
  const questionKeys = Array.from({ length: attempt.paper.numQuestions }, (_, i) => `q${i + 1}`);

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-1 text-xl font-semibold">{attempt.paper.title}</h1>
      <p className="mb-4 text-sm text-gray-500">
        {attempt.grade ? "Your paper has been graded." : "Submitted — awaiting grading."}
      </p>

      {attempt.grade && (
        <div className="mb-6 rounded border p-4">
          <p className="mb-2 font-semibold">
            Total: {attempt.grade.score?.toString()} / {attempt.grade.maxScore?.toString()}
          </p>
          {questionKeys.length > 1 && Object.keys(feedbackQuestions).length > 0 && (
            <div className="mb-3 flex flex-col gap-1">
              {questionKeys.map((k) => feedbackQuestions[k] && (
                <p key={k} className="text-sm text-gray-600">
                  {k.toUpperCase()}: {feedbackQuestions[k].score} / {feedbackQuestions[k].maxScore}
                </p>
              ))}
            </div>
          )}
          {attempt.grade.overallComment && (
            <p className="text-sm">{attempt.grade.overallComment}</p>
          )}
        </div>
      )}

      <h2 className="mb-2 font-medium">Your Paper</h2>
      <StudentPaperReviewClient
        fileUrl={`/api/files/${attempt.paper.paperFileKey}`}
        studentAnnotationPages={studentAnnotationPages as Record<string, [number, number][][]>}
        tutorAnnotationPages={attempt.grade ? tutorAnnotationPages as Record<string, [number, number][][]> : {}}
      />

      {questionKeys.length > 0 && (
        <>
          <h2 className="mb-2 font-medium">Your Answers</h2>
          <div className="flex flex-col gap-4">
            {questionKeys.map((key) => {
              const answer = attempt.answers.find((a) => a.questionKey === key);
              const content = answer?.richTextJson as JSONContent | null;
              return (
                <div key={key}>
                  <p className="mb-1 text-xs font-medium text-gray-500">{key.toUpperCase()}</p>
                  <AnswerView content={content} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
