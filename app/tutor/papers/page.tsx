import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Notice from "@/components/Notice";

export default async function PapersPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const papers = await prisma.paper.findMany({
    where: { tutorId: session.user.id },
    orderBy: { createdAt: "desc" },
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
          <li key={p.id} className="rounded border p-3">
            <p className="font-medium">{p.title}</p>
            <p className="text-sm text-gray-600">
              {p.defaultDurationMins} min{p.subject ? ` · ${p.subject}` : ""}
            </p>
          </li>
        ))}
        {papers.length === 0 && <p className="text-gray-500">No papers yet.</p>}
      </ul>
    </main>
  );
}
