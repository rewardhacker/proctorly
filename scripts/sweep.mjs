// Standalone sweep script — runs directly in GitHub Actions against the
// database, bypassing Vercel entirely. Mirrors the logic in
// lib/timer/resolveAttemptState.ts and lib/notifications.ts.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function notifySubmission(attemptId) {
  if (!process.env.RESEND_API_KEY) return;
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paper: { include: { tutor: true } }, tutee: true },
  });
  if (!attempt) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Proctorly <noreply@proctorly.com>",
      to: attempt.paper.tutor.email,
      subject: `${attempt.tutee.name} submitted "${attempt.paper.title}"`,
      text: `${attempt.tutee.name} has submitted their attempt at "${attempt.paper.title}".\n\nReview it at /tutor/attempts/${attempt.id}`,
    }),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
}

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
      await notifySubmission(attempt.id);
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
