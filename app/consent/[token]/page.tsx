import { loadInvite } from "@/lib/redeemInvite";
import { giveConsent } from "@/lib/actions";

export default async function ConsentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invite = await loadInvite(token);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Before you begin</h1>
      <p className="mb-4 text-sm text-gray-700">
        Hi {invite.tutee.name}, this platform records your exam activity to
        support fair marking and to let your tutor investigate any technical
        disputes. Specifically, we process:
      </p>
      <ul className="mb-4 list-disc pl-6 text-sm text-gray-700">
        <li>Your typed answers, PDF annotations, and any uploaded scans</li>
        <li>Tab-switch / focus-loss activity during the exam</li>
        <li>Timestamps of exam events (start, submit, uploads)</li>
      </ul>
      <p className="mb-4 text-sm text-gray-700">
        This data is used only for marking and dispute resolution, and is
        automatically deleted a set period after grading.
      </p>
      <form action={giveConsent.bind(null, token)}>
        <label className="mb-4 flex items-start gap-2 text-sm">
          <input type="checkbox" name="agree" required className="mt-1" />
          I understand and agree to this data processing.
        </label>
        <button type="submit" className="rounded bg-black px-4 py-2 text-white">
          Continue
        </button>
      </form>
    </main>
  );
}
