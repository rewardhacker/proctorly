import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

// Deletes uploaded scans, focus-tracking logs, and cached answer content
// once an attempt's retention period (set at grading, see gradeAttempt)
// has passed. Grades are kept indefinitely — only the underlying
// student-submitted content and activity logs are purged.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Forbidden", { status: 403 });
  }

  const expired = await prisma.attempt.findMany({
    where: { purgeAfter: { lt: new Date() }, purgedAt: null },
    include: { answers: true },
  });

  let purged = 0;
  for (const attempt of expired) {
    for (const answer of attempt.answers) {
      for (const key of answer.scanFileKeys) {
        await storage.delete(key).catch(() => {});
      }
    }
    await prisma.answer.updateMany({
      where: { attemptId: attempt.id },
      data: { richTextJson: Prisma.JsonNull, annotationJson: Prisma.JsonNull, scanFileKeys: [] },
    });
    await prisma.focusEvent.deleteMany({ where: { attemptId: attempt.id } });
    await prisma.activityLog.deleteMany({ where: { attemptId: attempt.id } });
    await prisma.attempt.update({ where: { id: attempt.id }, data: { purgedAt: new Date() } });
    purged++;
  }

  return Response.json({ purged });
}
