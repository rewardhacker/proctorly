import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { deletePaper } from "@/lib/actions";
import Link from "next/link";
import Notice from "@/components/Notice";
import ConfirmButton from "@/components/ConfirmButton";

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const session = await auth();

  const papers = await prisma.paper.findMany({
    where: { tutorId: session!.user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { attempts: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Papers</h1>
      <Notice error={error} success={success} />
      <Link
        href="/tutor/papers/new"
        className="mb-4 inline-block rounded bg-foreground px-4 py-2 text-white"
      >
        Upload a New Paper
      </Link>
      <ul className="flex flex-col gap-2">
        {papers.map((p) => (
          <li key={p.id} className="flex items-start justify-between rounded border p-3">
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-gray-600">
                {p.defaultDurationMins} min{p.subject ? ` · ${p.subject}` : ""} · {p._count.attempts} submission{p._count.attempts === 1 ? "" : "s"}
              </p>
            </div>
            <form action={deletePaper}>
              <input type="hidden" name="paperId" value={p.id} />
              <ConfirmButton
                message={`Delete "${p.title}" and all its submissions? This cannot be undone.`}
                className="rounded border px-2 py-1 text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </ConfirmButton>
            </form>
          </li>
        ))}
        {papers.length === 0 && <p className="text-gray-500">No papers yet.</p>}
      </ul>
    </main>
  );
}
