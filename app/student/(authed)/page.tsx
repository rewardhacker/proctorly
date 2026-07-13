export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getTuteeSession } from "@/lib/tuteeSession";
import Link from "next/link";

function statusLabel(status: string) {
  switch (status) {
    case "PENDING": return "Not started";
    case "IN_PROGRESS": return "In progress";
    case "UPLOAD_BUFFER": return "Uploading";
    case "SUBMITTED": return "Submitted – awaiting grade";
    case "GRADED": return "Graded";
    default: return status;
  }
}

const STATUS_PRIORITY = ["IN_PROGRESS", "UPLOAD_BUFFER", "PENDING", "SUBMITTED", "GRADED"];

export default async function StudentDashboard() {
  const session = await getTuteeSession();
  const tuteeId = session!.tuteeId;

  const [attempts, pendingInvites] = await Promise.all([
    prisma.attempt.findMany({
      where: { tuteeId },
      include: { paper: true, grade: true, answers: { select: { questionKey: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inviteLink.findMany({
      where: { tuteeId, usedAt: null, revokedAt: null },
      include: { paper: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // Group by paperId: one card per paper
  const byPaper = new Map<string, {
    paper: (typeof attempts)[0]["paper"];
    invite: (typeof pendingInvites)[0] | null;
    attempts: (typeof attempts);
  }>();

  for (const invite of pendingInvites) {
    byPaper.set(invite.paperId, { paper: invite.paper, invite, attempts: [] });
  }
  for (const attempt of attempts) {
    const entry = byPaper.get(attempt.paperId);
    if (entry) {
      entry.attempts.push(attempt);
    } else {
      byPaper.set(attempt.paperId, { paper: attempt.paper, invite: null, attempts: [attempt] });
    }
  }

  const papers = Array.from(byPaper.values());

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">My Papers</h1>

      {papers.length === 0 && (
        <p className="text-gray-500">No papers assigned yet. Ask your tutor for an invite link.</p>
      )}

      <ul className="flex flex-col gap-3">
        {papers.map(({ paper, invite, attempts: paperAttempts }) => {
          // Pick most actionable attempt by status priority
          const primary = paperAttempts.slice().sort(
            (a, b) => STATUS_PRIORITY.indexOf(a.status) - STATUS_PRIORITY.indexOf(b.status),
          )[0] ?? null;

          const isActive = primary && (primary.status === "IN_PROGRESS" || primary.status === "UPLOAD_BUFFER");
          const isGraded = primary?.status === "GRADED";
          const answeredCount = primary?.answers.filter((a) => a.questionKey.startsWith("q")).length ?? 0;
          const total = paper.numQuestions;
          const attemptCount = paperAttempts.length;

          return (
            <li key={paper.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{paper.title}</p>
                  {paper.subject && <p className="text-sm text-gray-500">{paper.subject}</p>}
                  {attemptCount > 1 && (
                    <p className="text-xs text-gray-400">Attempt {attemptCount}</p>
                  )}
                </div>
                {isGraded && primary?.grade && (
                  <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800">
                    {Number(primary.grade.score)}/{Number(primary.grade.maxScore)}
                  </span>
                )}
              </div>

              {primary ? (
                <>
                  <p className="mt-1 text-sm text-gray-500">{statusLabel(primary.status)}</p>
                  {(primary.status === "IN_PROGRESS" || primary.status === "PENDING") && (
                    <p className="text-sm text-gray-400">
                      {answeredCount} of {total} question{total === 1 ? "" : "s"} answered
                    </p>
                  )}
                  {primary.grade?.overallComment && (
                    <p className="mt-2 text-sm text-gray-600 italic">
                      &ldquo;{primary.grade.overallComment}&rdquo;
                    </p>
                  )}
                  {primary.status === "PENDING" && (
                    <Link href={`/exam/${primary.id}`} className="mt-3 inline-block rounded bg-foreground px-3 py-1.5 text-sm text-white">
                      Begin Exam
                    </Link>
                  )}
                  {isActive && (
                    <Link href={`/exam/${primary.id}`} className="mt-3 inline-block rounded bg-foreground px-3 py-1.5 text-sm text-white">
                      Continue Exam
                    </Link>
                  )}
                  {(primary.status === "SUBMITTED" || primary.status === "GRADED") && (
                    <Link href={`/exam/${primary.id}`} className="mt-3 inline-block rounded border px-3 py-1.5 text-sm">
                      Review Paper
                    </Link>
                  )}
                </>
              ) : invite ? (
                <>
                  <p className="mt-1 text-sm text-gray-500">
                    {paper.defaultDurationMins} min · Not started
                  </p>
                  <Link href={`/invite/${invite.token}`} className="mt-3 inline-block rounded bg-foreground px-3 py-1.5 text-sm text-white">
                    Begin Exam
                  </Link>
                </>
              ) : null}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
