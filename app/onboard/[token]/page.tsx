"use client";

import { use, useState } from "react";
import { completeTutorOnboarding } from "@/lib/actions";

export default function OnboardPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSubmitting(true);
    const result = await completeTutorOnboarding(token, formData);
    if (result?.error) { setError(result.error); setSubmitting(false); }
  }

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-2 text-2xl font-bold">Set Up Your Tutor Account</h1>
      <p className="mb-6 text-sm text-gray-600">
        Please read the policy below and complete your account to get started.
      </p>

      <section className="mb-6 rounded border bg-emphasis p-5 text-sm leading-relaxed text-gray-700">
        <h2 className="mb-3 font-semibold text-foreground">Tutor Policy — Best Practices &amp; Code of Conduct</h2>

        <p className="mb-3 font-medium">Best Practices</p>
        <ul className="mb-4 list-disc pl-5 space-y-1">
          <li>Give students adequate notice before assigning a timed exam.</li>
          <li>Provide clear, constructive feedback on graded submissions in a timely manner.</li>
          <li>Set realistic time limits appropriate to the paper and student level.</li>
          <li>Keep student data confidential and do not share results without consent.</li>
          <li>Only assign papers you have the right to distribute.</li>
        </ul>

        <p className="mb-3 font-medium">Code of Conduct</p>
        <ul className="mb-4 list-disc pl-5 space-y-1">
          <li>Treat all students with respect, fairness, and impartiality.</li>
          <li>Do not discriminate on the basis of age, gender, ethnicity, disability, or background.</li>
          <li>Maintain professional boundaries in all communications with students.</li>
          <li>Do not use student data for any purpose other than marking and academic feedback.</li>
          <li>Report any safeguarding concerns through the appropriate channels immediately.</li>
        </ul>

        <p className="mb-3 font-medium">Reporting Issues</p>
        <p>
          If you encounter a technical problem, a policy concern, or a safeguarding matter, contact the platform administrator at{" "}
          <a href="mailto:jakaria@live.co.uk" className="underline">jakaria@live.co.uk</a>.
          Include your name, the affected student (if applicable), and a brief description of the issue.
        </p>
      </section>

      <form action={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Full name</label>
          <input name="name" type="text" required className="w-full rounded border px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input name="password" type="password" required minLength={8} className="w-full rounded border px-3 py-2 text-sm" />
          <p className="mt-1 text-xs text-gray-500">Minimum 8 characters.</p>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="agree" required className="mt-1" />
          I have read and agree to the Tutor Policy above.
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-foreground px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </main>
  );
}
