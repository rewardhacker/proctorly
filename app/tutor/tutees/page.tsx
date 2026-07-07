import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createTutee, createInvite, resetTuteePassword, deleteInvite, deleteTutee } from "@/lib/actions";
import Notice from "@/components/Notice";
import ConfirmButton from "@/components/ConfirmButton";
import Link from "next/link";

export default async function TuteesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const session = await auth();
  const tutorId = session!.user.id;

  const [tutees, papers, invites] = await Promise.all([
    prisma.tutee.findMany({ where: { createdByTutorId: tutorId }, orderBy: { createdAt: "desc" } }),
    prisma.paper.findMany({ where: { tutorId }, orderBy: { createdAt: "desc" } }),
    prisma.inviteLink.findMany({
      where: { tutorId },
      include: { tutee: true, paper: true, attempt: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <Notice error={error} success={success} />
      <section>
        <h1 className="mb-4 text-xl font-semibold">Create a Tutee</h1>
        <form action={createTutee} className="flex flex-col gap-3">
          <input name="name" placeholder="Name" required className="rounded border px-3 py-2" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
            className="rounded border px-3 py-2"
          />
          <input
            name="password"
            type="text"
            placeholder="Login password (share with student)"
            required
            className="rounded border px-3 py-2"
          />
          <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
            Create Tutee
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Generate an Invite Link</h2>
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
              Generate Invite Link
            </button>
          </form>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Students</h2>
        {tutees.length === 0 ? (
          <p className="text-gray-500">No students yet.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {tutees.map((t) => (
              <li key={t.id} className="rounded border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/tutor/analytics/${t.id}`}
                      className="rounded border px-2 py-1 text-sm hover:bg-gray-50"
                    >
                      Analytics
                    </Link>
                  <form action={deleteTutee}>
                    <input type="hidden" name="tuteeId" value={t.id} />
                    <ConfirmButton
                      message={`Delete ${t.name} and all their submissions? This cannot be undone.`}
                      className="rounded border px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </ConfirmButton>
                  </form>
                  </div>
                </div>
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-800">
                    Reset password
                  </summary>
                  <form action={resetTuteePassword} className="mt-2 flex gap-2">
                    <input type="hidden" name="tuteeId" value={t.id} />
                    <input
                      name="password"
                      type="text"
                      placeholder="New password"
                      required
                      minLength={6}
                      className="flex-1 rounded border px-3 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded bg-foreground px-3 py-1.5 text-sm text-white"
                    >
                      Set
                    </button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Invite Links</h2>
        <ul className="flex flex-col gap-2">
          {invites.map((invite) => (
            <li key={invite.id} className="flex items-start justify-between gap-2 rounded border p-3 text-sm">
              <div>
                <p>
                  <span className="font-medium">{invite.tutee.name}</span> &rarr; {invite.paper.title}
                </p>
                <p className="break-all text-gray-600">
                  {`/invite/${invite.token}`}
                  {invite.usedAt ? " (redeemed)" : ""}
                </p>
              </div>
              <form action={deleteInvite}>
                <input type="hidden" name="inviteId" value={invite.id} />
                <ConfirmButton
                  message={
                    invite.attempt
                      ? "Delete this invite? The linked submission will also be deleted."
                      : "Delete this invite link?"
                  }
                  className="shrink-0 rounded border px-2 py-1 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </ConfirmButton>
              </form>
            </li>
          ))}
          {invites.length === 0 && <p className="text-gray-500">No invite links yet.</p>}
        </ul>
      </section>
    </main>
  );
}
