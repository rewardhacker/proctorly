export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deleteAttempt, resetAttempt } from "@/lib/actions";
import { computeFlagStatus } from "@/lib/antiCheat";
import Link from "next/link";
import Notice from "@/components/Notice";
import ConfirmButton from "@/components/ConfirmButton";

const fmt = (d: Date | null) =>
  d ? d.toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" }) : null;

export default async function AttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const session = await auth();

  const attempts = await prisma.attempt.findMany({
    where: { paper: { tutorId: session!.user.id } },
    include: {
      tutee: true,
      paper: true,
      grade: true,
      focusEvents: { select: { type: true, durationMs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Submissions</h1>
      <Notice error={error} success={success} />
      <ul className="flex flex-col gap-2">
        {attempts.map((a) => {
          const flagged = computeFlagStatus(a.focusEvents).flagged;
          return (
            <li key={a.id} className="rounded border p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {a.tutee.name} &middot; {a.paper.title}{" "}
                    {flagged && <span className="text-yellow-600">&#9873; flagged</span>}
                  </p>
                  <p className="text-sm text-gray-600">Status: {a.status}</p>
                  {a.submittedAt && (
                    <p className="text-xs text-gray-400">Submitted: {fmt(a.submittedAt)}</p>
                  )}
                  {a.grade?.gradedAt && (
                    <p className="text-xs text-gray-400">Graded: {fmt(a.grade.gradedAt)}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={resetAttempt}>
                    <input type="hidden" name="attemptId" value={a.id} />
                    <ConfirmButton
                      message="Reset this submission to pending? All answers and grades will be cleared."
                      className="rounded border px-2 py-1 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Reset
                    </ConfirmButton>
                  </form>
                  <form action={deleteAttempt}>
                    <input type="hidden" name="attemptId" value={a.id} />
                    <ConfirmButton
                      message="Delete this submission permanently?"
                      className="rounded border px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                </div>
              </div>
              {(a.status === "SUBMITTED" || a.status === "GRADED") && (
                <Link
                  href={`/tutor/attempts/${a.id}`}
                  className="mt-2 inline-block rounded bg-foreground px-3 py-1 text-sm text-white"
                >
                  {a.status === "GRADED" ? "View Grade" : "Grade This Attempt"}
                </Link>
              )}
            </li>
          );
        })}
        {attempts.length === 0 && <p className="text-gray-500">No submissions yet.</p>}
      </ul>
    </main>
  );
}
