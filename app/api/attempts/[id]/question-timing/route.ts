import { prisma } from "@/lib/prisma";
import { getTuteeSession } from "@/lib/tuteeSession";

type TimingEntry = { totalMs: number; firstFocusAt: string | null };
type TimingJson = Record<string, TimingEntry>;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const tutee = await getTuteeSession();
  if (!tutee) return new Response("Forbidden", { status: 403 });

  let body: { questionKey: string; addMs: number; firstFocusAt?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { questionKey, addMs, firstFocusAt } = body;
  if (!questionKey || typeof addMs !== "number" || addMs < 0) {
    return new Response("Bad request", { status: 400 });
  }

  const attempt = await prisma.attempt.findFirst({
    where: { id, tuteeId: tutee.tuteeId, status: "IN_PROGRESS" },
    select: { id: true, questionTimingJson: true },
  });
  if (!attempt) return new Response("Not found", { status: 404 });

  const existing = (attempt.questionTimingJson ?? {}) as TimingJson;
  const prev = existing[questionKey] ?? { totalMs: 0, firstFocusAt: null };

  existing[questionKey] = {
    totalMs: prev.totalMs + addMs,
    firstFocusAt: prev.firstFocusAt ?? firstFocusAt ?? null,
  };

  await prisma.attempt.update({
    where: { id },
    data: { questionTimingJson: existing },
  });

  return new Response(null, { status: 204 });
}
