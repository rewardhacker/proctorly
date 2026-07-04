import { prisma } from "@/lib/prisma";
import { resolveAttemptState } from "@/lib/timer/resolveAttemptState";

// Backstop for attempts nobody is actively polling (closed laptop, dead
// tab). Wire this up to Vercel Cron (or any scheduler) hitting this route
// every ~1 minute with `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Forbidden", { status: 403 });
  }

  const overdue = await prisma.attempt.findMany({
    where: {
      status: { in: ["IN_PROGRESS", "UPLOAD_BUFFER"] },
      OR: [{ hardEndAt: { lt: new Date() } }, { bufferEndAt: { lt: new Date() } }],
    },
  });

  for (const attempt of overdue) {
    await resolveAttemptState(attempt);
  }

  return Response.json({ swept: overdue.length });
}
