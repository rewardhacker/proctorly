import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { toggleAnalyticsSharing } from "@/lib/actions";
import Link from "next/link";

function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  const color = pct >= 70 ? "bg-green-500" : pct >= 50 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-2.5 flex-1 rounded bg-gray-100">
        <div className={`h-2.5 rounded ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-20 shrink-0 text-right text-xs text-gray-600">
        {score}/{max} ({pct}%)
      </span>
    </div>
  );
}

function fmtMs(ms: number): string {
  const totalSecs = Math.round(ms / 1000);
  const m = Math.floor(totalSecs / 60);
  const s = totalSecs % 60;
  if (m === 0) return `${s}s`;
  return s === 0 ? `${m}m` : `${m}m ${s}s`;
}

function elapsedMins(from: Date | null, iso: string | null): string | null {
  if (!from || !iso) return null;
  const ms = new Date(iso).getTime() - from.getTime();
  if (ms < 0) return null;
  return fmtMs(ms);
}

function minsFromStartEnd(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return Math.round((end.getTime() - start.getTime()) / 60000);
}

type TimingMap = Record<string, { totalMs: number; firstFocusAt: string | null }>;
type PerQScores = Record<string, { score: number; maxScore: number }>;

export default async function TutorAnalyticsPage({
  params,
}: {
  params: Promise<{ tuteeId: string }>;
}) {
  const { tuteeId } = await params;
  const session = await auth();
  const tutorId = session!.user.id;

  const tutee = await prisma.tutee.findFirst({
    where: { id: tuteeId, createdByTutorId: tutorId },
  });
  if (!tutee) redirect("/tutor/tutees");

  const attempts = await prisma.attempt.findMany({
    where: { tuteeId, status: "GRADED" },
    include: { paper: true, grade: true },
    orderBy: { submittedAt: "asc" },
  });

  const data = attempts.map((a) => {
    const perQ = (a.grade?.feedbackJson ?? {}) as PerQScores;
    const timing = (a.questionTimingJson ?? {}) as TimingMap;
    return {
      id: a.id,
      paperTitle: a.paper.title,
      subject: a.paper.subject,
      variant: a.paper.paperVariant,
      score: Number(a.grade?.score ?? 0),
      maxScore: Number(a.grade?.maxScore ?? 0),
      allocatedMins: a.totalDurationMins ?? a.paper.defaultDurationMins,
      timeTaken: minsFromStartEnd(a.startedAt, a.submittedAt),
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      perQ,
      timing,
    };
  });

  const bySubject = new Map<string, typeof data>();
  for (const d of data) {
    const key = d.subject ?? "Other";
    if (!bySubject.has(key)) bySubject.set(key, []);
    bySubject.get(key)!.push(d);
  }

  const byVariant = new Map<string, typeof data>();
  for (const d of data.filter((d) => d.variant)) {
    const key = d.variant!;
    if (!byVariant.has(key)) byVariant.set(key, []);
    byVariant.get(key)!.push(d);
  }

  function avgPct(items: typeof data): number {
    const scored = items.filter((d) => d.maxScore > 0);
    if (!scored.length) return 0;
    return Math.round(scored.reduce((s, d) => s + (d.score / d.maxScore) * 100, 0) / scored.length);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/tutor/tutees" className="text-sm text-gray-500 hover:text-gray-800">
            ← Tutees
          </Link>
          <h1 className="mt-1 text-xl font-semibold">{tutee.name} — Analytics</h1>
        </div>
        <form action={toggleAnalyticsSharing}>
          <input type="hidden" name="tuteeId" value={tuteeId} />
          <input type="hidden" name="share" value={tutee.analyticsSharedWithStudent ? "false" : "true"} />
          <button
            type="submit"
            className={`rounded border px-3 py-1.5 text-sm ${
              tutee.analyticsSharedWithStudent
                ? "border-green-600 bg-green-50 text-green-700 hover:bg-green-100"
                : "border-gray-300 hover:bg-gray-50"
            }`}
          >
            {tutee.analyticsSharedWithStudent ? "Shared with student ✓" : "Share with student"}
          </button>
        </form>
      </div>

      {data.length === 0 ? (
        <p className="text-gray-500">No graded papers yet.</p>
      ) : (
        <>
          {/* Summary cards */}
          <section className="grid grid-cols-3 gap-4">
            <div className="rounded border p-4 text-center">
              <p className="text-2xl font-bold">{data.length}</p>
              <p className="text-sm text-gray-500">Papers graded</p>
            </div>
            <div className="rounded border p-4 text-center">
              <p className="text-2xl font-bold">{avgPct(data)}%</p>
              <p className="text-sm text-gray-500">Average score</p>
            </div>
            <div className="rounded border p-4 text-center">
              <p className="text-2xl font-bold">
                {(() => {
                  const timed = data.filter((d) => d.timeTaken !== null);
                  if (!timed.length) return "—";
                  const avg = Math.round(timed.reduce((s, d) => s + d.timeTaken!, 0) / timed.length);
                  return `${avg}m`;
                })()}
              </p>
              <p className="text-sm text-gray-500">Avg time taken</p>
            </div>
          </section>

          {/* Variant comparison */}
          {byVariant.size >= 2 && (
            <section>
              <h2 className="mb-3 font-semibold">Variant Comparison</h2>
              <div className="flex flex-col gap-2">
                {Array.from(byVariant.entries()).map(([variant, items]) => (
                  <div key={variant} className="grid grid-cols-[140px_1fr] items-center gap-3">
                    <span className="text-sm font-medium">{variant}</span>
                    <ScoreBar score={avgPct(items)} max={100} />
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-gray-400">Average % per variant</p>
            </section>
          )}

          {/* Subject breakdown */}
          {bySubject.size >= 2 && (
            <section>
              <h2 className="mb-3 font-semibold">By Subject</h2>
              <div className="flex flex-col gap-2">
                {Array.from(bySubject.entries()).map(([subject, items]) => (
                  <div key={subject} className="grid grid-cols-[160px_1fr] items-center gap-3">
                    <span className="text-sm font-medium">{subject}</span>
                    <ScoreBar score={avgPct(items)} max={100} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Per-attempt breakdown */}
          <section>
            <h2 className="mb-3 font-semibold">All Attempts</h2>
            <div className="flex flex-col gap-4">
              {data.map((d) => {
                const qKeys = Object.keys(d.perQ).sort();
                const hasTimingData = Object.keys(d.timing).length > 0;

                return (
                  <div key={d.id} className="rounded border p-4">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{d.paperTitle}</p>
                        <p className="text-xs text-gray-500">
                          {[d.subject, d.variant].filter(Boolean).join(" · ")}
                          {d.submittedAt && <> · {new Date(d.submittedAt).toLocaleDateString()}</>}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-sm">
                        <span className="font-semibold">{d.score}/{d.maxScore}</span>
                        {d.timeTaken !== null && (
                          <p className="text-xs text-gray-500">{d.timeTaken}m / {d.allocatedMins}m allowed</p>
                        )}
                      </div>
                    </div>
                    <ScoreBar score={d.score} max={d.maxScore} />

                    {/* Per-question breakdown with timing */}
                    {qKeys.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                          Per-question breakdown
                        </summary>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-left text-gray-400">
                                <th className="pb-1 pr-3 font-normal">Q</th>
                                <th className="pb-1 pr-3 font-normal">Score</th>
                                {hasTimingData && (
                                  <>
                                    <th className="pb-1 pr-3 font-normal">Time spent</th>
                                    <th className="pb-1 font-normal">First entered</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {qKeys.map((qk) => {
                                const v = d.perQ[qk];
                                const t = d.timing[qk];
                                const firstEnteredAfter = elapsedMins(d.startedAt, t?.firstFocusAt ?? null);
                                return (
                                  <tr key={qk}>
                                    <td className="py-1.5 pr-3 font-medium uppercase text-gray-600">{qk}</td>
                                    <td className="py-1.5 pr-3">
                                      <div className="flex items-center gap-2">
                                        <ScoreBar score={v.score} max={v.maxScore} />
                                      </div>
                                    </td>
                                    {hasTimingData && (
                                      <>
                                        <td className="py-1.5 pr-3 text-gray-600">
                                          {t ? fmtMs(t.totalMs) : "—"}
                                        </td>
                                        <td className="py-1.5 text-gray-500">
                                          {firstEnteredAfter
                                            ? `${firstEnteredAfter} in`
                                            : t?.firstFocusAt ? "—" : "not typed"}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
