import { prisma } from "@/lib/prisma";
import { getTuteeSession } from "@/lib/tuteeSession";
import Link from "next/link";

function statusLabel(status: string) {
  switch (status) {
    case "PENDING": return "Not started";
    case "IN_PROGRESS": return "In progress";
    case "UPLOAD_BUFFER": return "Uploading";
    case "SUBMITTED": return "Submitted — awaiting grade";
    case "GRADED": return "Graded";
    default: return status;
  }
}

export default async function StudentDashboard() {
  const session = await getTuteeSession();
  const tuteeId = session!.tuteeId;

  const [attempts, pendingInvites] = await Promise.all([
    prisma.attempt.findMany({
      where: { tuteeId },
      include: {
        paper: true,
        grade: true,
        answers: { select: { questionKey: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inviteLink.findMany({
      where: { tuteeId, usedAt: null, revokedAt: null },
      include: { paper: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const hasAnything = attempts.length > 0 || pendingInvites.length > 0;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">My Papers</h1>

      {!hasAnything && (
        <p className="text-gray-500">No papers assigned yet. Ask your tutor for an invite link.</p>
      )}

      <ul className="flex flex-col gap-3">
        {/* Unredeemed invite links — show as "not started, click to begin" */}
        {pendingInvites.map((invite) => (
          <li key={invite.id} className="rounded border p-4">
            <p className="font-medium">{invite.paper.title}</p>
            {invite.paper.subject && (
              <p className="text-sm text-gray-500">{invite.paper.subject}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              {invite.paper.defaultDurationMins} min · Not started
            </p>
            <Link
              href={`/invite/${invite.token}`}
              className="mt-3 inline-block rounded bg-foreground px-3 py-1.5 text-sm text-white"
            >
              Begin Exam
            </Link>
          </li>
        ))}

        {/* Attempts (started or completed) */}
        {attempts.map((attempt) => {
          const answeredCount = attempt.answers.filter(
            (a) => a.questionKey.startsWith("q"),
          ).length;
          const total = attempt.paper.numQuestions;
          const isActive = attempt.status === "IN_PROGRESS" || attempt.status === "UPLOAD_BUFFER";
          const isGraded = attempt.status === "GRADED";

          return (
            <li key={attempt.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{attempt.paper.title}</p>
                  {attempt.paper.subject && (
                    <p className="text-sm text-gray-500">{attempt.paper.subject}</p>
                  )}
                </div>
                {isGraded && attempt.grade && (
                  <span className="shrink-0 rounded bg-green-100 px-2 py-0.5 text-sm font-medium text-green-800">
                    {Number(attempt.grade.score)}/{Number(attempt.grade.maxScore)}
                  </span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">{statusLabel(attempt.status)}</p>

              {(attempt.status === "IN_PROGRESS" || attempt.status === "PENDING") && (
                <p className="text-sm text-gray-400">
                  {answeredCount} of {total} question{total === 1 ? "" : "s"} answered
                </p>
              )}

              {attempt.grade?.overallComment && (
                <p className="mt-2 text-sm text-gray-600 italic">
                  &ldquo;{attempt.grade.overallComment}&rdquo;
                </p>
              )}

              {isActive && (
                <Link
                  href={`/exam/${attempt.id}`}
                  className="mt-3 inline-block rounded bg-foreground px-3 py-1.5 text-sm text-white"
                >
                  Continue Exam
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
