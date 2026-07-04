import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PapersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const papers = await prisma.paper.findMany({
    where: { tutorId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Papers</h1>
      <Link href="/tutor/papers/new" className="mb-4 inline-block underline">
        Upload a new paper
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
