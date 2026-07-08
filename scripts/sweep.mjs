// Standalone sweep script — runs directly in GitHub Actions against the
// database, bypassing Vercel entirely. Mirrors the logic in
// lib/timer/resolveAttemptState.ts. No emails are sent from the cron
// sweep; notifications are handled by the app when users are active.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resolveAttemptState(attempt) {
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
      // No email from the cron sweep — app handles notifications on active polls.
    }
    return prisma.attempt.findUniqueOrThrow({ where: { id: attempt.id } });
  }

  return attempt;
}

async function main() {
  const overdue = await prisma.attempt.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "UPLOAD_BUFFER"] },
      OR: [{ hardEndAt: { lt: new Date() } }, { bufferEndAt: { lt: new Date() } }],
    },
  });

  for (const attempt of overdue) {
    await resolveAttemptState(attempt);
  }

  console.log(JSON.stringify({ swept: overdue.length }));
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
