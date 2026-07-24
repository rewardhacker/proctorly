// Standalone sweep script — runs directly in GitHub Actions against the
// database, bypassing Vercel entirely. Mirrors the logic in
// lib/timer/resolveAttemptState.ts and lib/notifications.ts.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function sendEmail(to, subject, text) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email stub] to=${to} subject="${subject}"`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: "Proctorly <noreply@proctorly.com>", to, subject, text }),
  });
  if (!res.ok) console.error("Resend error:", await res.text());
}

async function notifySubmission(attemptId) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paper: { include: { tutor: true } }, tutee: true },
  });
  if (!attempt) return;
  await sendEmail(
    attempt.paper.tutor.email,
    `${attempt.tutee.name} submitted "${attempt.paper.title}"`,
    `${attempt.tutee.name} has submitted their attempt at "${attempt.paper.title}".\n\nReview it at /tutor/attempts/${attempt.id}`,
  );
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

async function withRetry(fn, retries = 3, delayMs = 5000) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries - 1) throw e;
      console.error(`Sweep attempt ${i + 1} failed, retrying in ${delayMs}ms:`, e.message);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

withRetry(main)
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
