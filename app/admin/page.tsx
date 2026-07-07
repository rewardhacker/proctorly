import { prisma } from "@/lib/prisma";
import { inviteTutor } from "@/lib/actions";
import Notice from "@/components/Notice";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;

  const tutors = await prisma.tutor.findMany({
    where: { isAdmin: false },
    orderBy: { createdAt: "asc" },
  });

  const pendingInvites = await prisma.tutorInvite.findMany({
    where: { usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Admin</h1>
      <Notice error={error} success={success} />

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Invite a Tutor</h2>
        <form action={inviteTutor} className="flex gap-2">
          <input
            name="email"
            type="email"
            required
            placeholder="tutor@email.com"
            className="flex-1 rounded border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded bg-foreground px-4 py-2 text-sm text-white">
            Send Invite
          </button>
        </form>
      </section>

      {pendingInvites.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Pending Invites</h2>
          <ul className="flex flex-col gap-2">
            {pendingInvites.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between rounded border p-3 text-sm">
                <span>{inv.email}</span>
                <span className="text-gray-500">
                  Expires {inv.expiresAt.toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tutors</h2>
        {tutors.length === 0 ? (
          <p className="text-sm text-gray-500">No tutors yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tutors.map((t) => (
              <li key={t.id} className="rounded border p-3 text-sm">
                <p className="font-medium">{t.name}</p>
                <p className="text-gray-500">{t.email}</p>
                <p className="mt-1 text-xs text-gray-400">
                  {t.policyConsentedAt
                    ? `Policy signed ${t.policyConsentedAt.toLocaleDateString()} (${t.policyVersion})`
                    : "Policy not yet signed"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
