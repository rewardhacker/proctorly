import { prisma } from "@/lib/prisma";
import { getTuteeSession } from "@/lib/tuteeSession";
import { resolveAttemptState } from "@/lib/timer/resolveAttemptState";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tutee = await getTuteeSession();
  if (!tutee) return new Response("Forbidden", { status: 403 });

  const attempt = await prisma.attempt.findFirst({
    where: { id, tuteeId: tutee.tuteeId },
  });
  if (!attempt) return new Response("Not found", { status: 404 });

  const resolved = await resolveAttemptState(attempt);

  return Response.json({
    serverNow: new Date().toISOString(),
    status: resolved.status,
    hardEndAt: resolved.hardEndAt,
    bufferEndAt: resolved.bufferEndAt,
  });
}
