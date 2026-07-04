import { prisma } from "@/lib/prisma";
import { notifySubmission } from "@/lib/notifications";
import type { Attempt } from "@prisma/client";

// ponytail: no persistent timer process. Every read/write "touches" the
// attempt through this resolver, so state is always corrected against the
// server clock before use. The cron sweep (api/cron/sweep-attempts) is the
// backstop for attempts nobody is actively polling. Transitions use a
// status-guarded updateMany so concurrent callers (client poll racing the
// cron sweep, or two polls in flight) can't both "win" and double-log.
export async function resolveAttemptState(attempt: Attempt): Promise<Attempt> {
  const now = new Date();

  if (attempt.status === "IN_PROGRESS" && attempt.hardEndAt && now > attempt.hardEndAt) {
    const result = await prisma.attempt.updateMany({
      where: { id: attempt.id, status: "IN_PROGRESS" },
      data: { status: "UPLOAD_BUFFER" },
    });
    if (result.count > 0) {
      await prisma.activityLog.create({
        data: { attemptId: attempt.id, event: "MAIN_TIMER_EXPIRED" },
      });
    }
    const updated = await prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
    return resolveAttemptState(updated);
  }

  if (attempt.status === "UPLOAD_BUFFER" && attempt.bufferEndAt && now > attempt.bufferEndAt) {
    const result = await prisma.attempt.updateMany({
      where: { id: attempt.id, status: "UPLOAD_BUFFER" },
      data: {
        status: "SUBMITTED",
        autoSubmitted: true,
        submittedAt: attempt.bufferEndAt,
        markSchemeReleasedAt: attempt.bufferEndAt,
      },
    });
    if (result.count > 0) {
      await prisma.activityLog.create({
        data: { attemptId: attempt.id, event: "AUTO_SUBMITTED" },
      });
      await notifySubmission(attempt.id);
    }
    return prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
  }

  return attempt;
}
