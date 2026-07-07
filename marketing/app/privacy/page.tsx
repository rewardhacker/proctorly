import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – Proctorly",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col font-[family-name:var(--font-mulish)]">
      {/* ── Nav ── */}
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-[family-name:var(--font-arima-madurai)] text-xl font-bold tracking-tight">
          Proctorly
        </a>
        <a href="/" className="text-sm underline opacity-60 hover:opacity-100">← Back</a>
      </header>

      {/* ── Content ── */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12 space-y-8 text-sm leading-relaxed">
        <div>
          <p className="text-xs opacity-50 mb-1">Last updated 7 July 2026</p>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-arima-madurai)]">Privacy Policy</h1>
          <p className="mt-3 opacity-70">
            Proctorly ("we", "us") provides a remote practice exam platform for private tutors and their students.
            This policy explains what personal data we collect, why we collect it, how we use it, and your rights
            under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </div>

        <Section title="Who We Are">
          <p>
            Proctorly is operated by Jakaria Uddin. Our contact email is{" "}
            <a href="mailto:hello@jakadin.com" className="underline">hello@jakadin.com</a>.
            For the purposes of UK data protection law, we are the data controller for the personal data
            collected through this platform.
          </p>
        </Section>

        <Section title="What We Collect">
          <ul className="space-y-2 list-none">
            <Li label="Account Information">Your name and email address, provided when you sign up.</Li>
            <Li label="Exam Papers">PDF files uploaded by tutors. These are stored on our platform and shared only with the students the tutor assigns them to.</Li>
            <Li label="Exam Attempts">Your answers, per-question timing data, scan uploads (for handwritten answers), and overall scores.</Li>
            <Li label="Tutor Feedback">PDF annotations, per-question marks, and overall comments left by tutors after marking.</Li>
            <Li label="Subscription Information">Your chosen plan and billing status. Payment card details are never seen or stored by us – they are handled directly by Stripe (see "Third parties" below).</Li>
            <Li label="Technical Data">Basic logs from our infrastructure providers, including IP address, browser type, and approximate location, used to keep the service running and secure.</Li>
          </ul>
        </Section>

        <Section title="Why We Use It">
          <p className="mb-3">We use your personal data only to:</p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>Provide the exam platform you have signed up for.</li>
            <li>Communicate with you about your account, exams, or results.</li>
            <li>Take payments via Stripe and keep records required for tax and accounting.</li>
            <li>Improve the service – for example, fixing bugs and monitoring uptime. We do not read exam content for this purpose; we may look at aggregate, non-identifying technical metrics.</li>
            <li>Comply with our legal obligations.</li>
          </ul>
          <p className="mt-3 opacity-70">
            Our lawful bases under UK GDPR are <strong>contract</strong> (most of the above is necessary
            to deliver the service you signed up for), <strong>legitimate interests</strong> (running
            and securing the platform), and <strong>consent</strong> (where we ask you to opt in).
          </p>
        </Section>

        <Section title="Who Can See Your Data">
          <ul className="space-y-2 list-none">
            <Li label="Your Tutor Sees">Your name, email, exam attempts, per-question scores, scan uploads, and any feedback they have written.</Li>
            <Li label="Proctorly Admin Sees">The same as your tutor, plus subscription status – used only to operate the service.</Li>
            <Li label="You Always See">Your own data, and can export or delete it (see "Your rights" below).</Li>
            <Li label="Other Students Never See">Your data. Tutors only see data for students assigned to them.</Li>
          </ul>
        </Section>

        <Section title="Third Parties">
          <p className="mb-3">
            We share your data only with the following processors, each of which has signed appropriate
            data-processing agreements with us:
          </p>
          <ul className="space-y-2 list-none">
            <Li label="Supabase">Database and authentication. Data is stored in their EU region.</Li>
            <Li label="Vercel">Hosting for the platform application.</Li>
            <Li label="Stripe">Payment processing. We never see your card details; Stripe handles them under PCI-DSS standards.</Li>
            <Li label="Resend">Sending transactional email (welcome messages, confirmations, reminders). They receive your email address and the email content we send.</Li>
          </ul>
          <p className="mt-3 font-medium">We do not sell your personal data to anyone, for any reason.</p>
        </Section>

        <Section title="How Long We Keep It">
          <p className="mb-2"><strong>Active accounts:</strong> as long as you remain a user on the platform.</p>
          <p>
            <strong>Closed accounts:</strong> we retain your data for up to 24 months after you stop using
            the service, in case you return – after that we delete or anonymise it, except where we are
            legally required to keep records (e.g. tax records for 6 years).
          </p>
        </Section>

        <Section title="Your Rights">
          <p className="mb-3">Under UK GDPR you have the right to:</p>
          <ul className="list-disc list-inside space-y-1 opacity-80">
            <li>Access the personal data we hold about you</li>
            <li>Correct any inaccuracies</li>
            <li>Have your data deleted (the "right to be forgotten")</li>
            <li>Restrict or object to certain processing</li>
            <li>Export your data in a portable format</li>
            <li>Withdraw consent at any time (where we rely on consent)</li>
            <li>
              Lodge a complaint with the Information Commissioner's Office (ICO) at{" "}
              <a href="https://ico.org.uk" className="underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a>
            </li>
          </ul>
          <p className="mt-3 opacity-70">
            To exercise any of these rights, email{" "}
            <a href="mailto:hello@jakadin.com" className="underline">hello@jakadin.com</a>.
            We will respond within 30 days.
          </p>
        </Section>

        <Section title="Security">
          <p>
            Data is encrypted in transit (HTTPS) and at rest. Access to the database is limited to the
            admin team and protected by row-level security policies. We have no access to your password –
            we store only a one-way hash.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          <p>
            If we make material changes, we will email all active accounts at least 14 days before the
            change takes effect. The "last updated" date at the top of this page reflects the most recent revision.
          </p>
        </Section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-8 text-center text-xs opacity-40">
        <p>© {new Date().getFullYear()} Proctorly · Proctoring Exam Practice Properly</p>
        <p className="mt-2">
          <a href="/privacy" className="underline hover:opacity-70">Privacy Policy</a>
        </p>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold font-[family-name:var(--font-arima-madurai)]">{title}</h2>
      <div className="opacity-80 space-y-2">{children}</div>
    </section>
  );
}

function Li({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li>
      <span className="font-semibold">{label}</span> – {children}
    </li>
  );
}
