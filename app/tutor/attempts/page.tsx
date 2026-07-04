import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { computeFlagStatus } from "@/lib/antiCheat";
import Link from "next/link";
import Notice from "@/components/Notice";

export default async function AttemptsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const attempts = await prisma.attempt.findMany({
    where: { paper: { tutorId: session.user.id } },
    include: { tutee: true, paper: true, grade: true, focusEvents: true },
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
              <p className="font-medium">
                {a.tutee.name} &middot; {a.paper.title}{" "}
                {flagged && <span className="text-yellow-600">&#9873; flagged</span>}
              </p>
              <p className="text-sm text-gray-600">Status: {a.status}</p>
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
