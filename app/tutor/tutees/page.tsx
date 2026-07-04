import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createTutee, createInvite } from "@/lib/actions";

export default async function TuteesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const tutorId = session.user.id;

  const [tutees, papers, invites] = await Promise.all([
    prisma.tutee.findMany({ where: { createdByTutorId: tutorId }, orderBy: { createdAt: "desc" } }),
    prisma.paper.findMany({ where: { tutorId }, orderBy: { createdAt: "desc" } }),
    prisma.inviteLink.findMany({
      where: { tutorId },
      include: { tutee: true, paper: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <section>
        <h1 className="mb-4 text-xl font-semibold">Create a tutee</h1>
        <form action={createTutee} className="flex flex-col gap-3">
          <input name="name" placeholder="Name" required className="rounded border px-3 py-2" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded border px-3 py-2"
          />
          <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
            Create tutee
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Generate an invite link</h2>
        {tutees.length === 0 || papers.length === 0 ? (
          <p className="text-gray-500">
            Create a tutee and upload a paper before generating an invite link.
          </p>
        ) : (
          <form action={createInvite} className="flex flex-col gap-3">
            <select name="tuteeId" required className="rounded border px-3 py-2">
              {tutees.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
            <select name="paperId" required className="rounded border px-3 py-2">
              {papers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
              Generate invite link
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Invite links</h2>
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id} className="rounded border p-3 text-sm">
              <p>
                <span className="font-medium">{invite.tutee.name}</span> &rarr; {invite.paper.title}
              </p>
              <p className="break-all text-gray-600">
                {`/invite/${invite.token}`}
                {invite.usedAt ? " (redeemed)" : ""}
              </p>
            </li>
          ))}
          {invites.length === 0 && <p className="text-gray-500">No invite links yet.</p>}
        </ul>
      </section>
    </main>
  );
}
