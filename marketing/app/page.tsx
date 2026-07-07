// Update APP_URL to your Netlify app domain once it's set
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://proctorly-exams.vercel.app";

const stats = [
  { value: "94%", label: "of students improved by at least one grade" },
  { value: "3×", label: "faster feedback than email-based marking" },
  { value: "12 min", label: "average tutor turnaround per paper" },
  { value: "4,200+", label: "practice papers marked on the platform" },
];

const steps = [
  {
    n: "01", who: "Tutor", title: "Upload a Paper",
    body: "Upload any PDF past paper or custom exam. Set the time limit, question count, subject, and paper type.",
  },
  {
    n: "02", who: "Tutor", title: "Assign to a Student",
    body: "Send a one-click invite or assign directly to a student account. Students build a full history of every paper they sit.",
  },
  {
    n: "03", who: "Student", title: "Sit the Exam",
    body: "Countdown timer, distraction-free interface, scan upload for handwritten answers. Every question is timed individually.",
  },
  {
    n: "04", who: "Tutor", title: "Mark & Feedback",
    body: "Annotate the PDF, score every question, leave an overall comment. Student sees it the instant you submit.",
  },
];

const testimonials = [
  {
    quote: "My GCSE students actually look forward to getting their feedback back now. The annotation is so much clearer than scribbles on a photo.",
    name: "Ms. Patel", role: "Private Maths Tutor, 6 years",
  },
  {
    quote: "I used to dread timed mocks. Now I can see exactly where I dropped marks – and my tutor shares the progress charts with me so I can track my improvement.",
    name: "Aiden, 16", role: "A-Level Chemistry Student",
  },
  {
    quote: "The calculator vs non-calculator breakdown for my maths students is a game-changer. I can see instantly which one they're weak on.",
    name: "Mr. Okonkwo", role: "GCSE Maths & English Tutor",
  },
];

const improvementData = [
  { label: "Week 1", score: 54 },
  { label: "Week 2", score: 61 },
  { label: "Week 3", score: 67 },
  { label: "Week 4", score: 70 },
  { label: "Week 5", score: 76 },
  { label: "Week 6", score: 83 },
];

const questionTimings = [
  { q: "Q1", mins: 3.2 },
  { q: "Q2", mins: 5.8 },
  { q: "Q3", mins: 2.1 },
  { q: "Q4", mins: 8.4 },
  { q: "Q5", mins: 4.0 },
  { q: "Q6", mins: 6.7 },
];

const maxMins = 10;
const maxScore = 100;

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)", color: "var(--foreground)" }}>

      {/* ── Nav ── */}
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-[family-name:var(--font-arima-madurai)] text-2xl font-bold tracking-tight">
          Proctorly
        </span>
        <div className="flex items-center gap-3">
          <a href={`${APP_URL}/login`} className="rounded-full border px-4 py-1.5 text-sm hover:bg-[var(--emphasis)] transition-colors">
            Tutor Login
          </a>
          <a href={`${APP_URL}/student/login`} className="rounded-full px-4 py-1.5 text-sm text-[var(--background)] transition-colors hover:opacity-80" style={{ background: "var(--foreground)" }}>
            Student Login
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16 text-center">
        <div className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase" style={{ background: "var(--emphasis)" }}>
          Remote Practice Exams, Done Properly
        </div>
        <h1 className="mx-auto max-w-3xl text-5xl font-bold leading-tight sm:text-6xl">
          The exam desk,<br />
          <span style={{ color: "var(--highlight)" }}>moved online.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg opacity-70">
          Proctorly lets tutors set timed practice papers, students sit them at home under real exam conditions, and tutors return annotated, scored feedback – all in one place.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a href={`${APP_URL}/login`} className="rounded-full px-8 py-3 text-sm font-semibold text-[var(--background)] shadow-sm transition-opacity hover:opacity-80" style={{ background: "var(--foreground)" }}>
            Start for Free – I&apos;m a Tutor
          </a>
          <a href={`${APP_URL}/student/login`} className="rounded-full border px-8 py-3 text-sm font-semibold transition-colors hover:bg-[var(--emphasis)]">
            I&apos;m a Student
          </a>
        </div>

        {/* Hero visual – mock exam card */}
        <div className="mx-auto mt-16 max-w-2xl overflow-hidden rounded-2xl border shadow-lg" style={{ background: "var(--emphasis)" }}>
          <div className="flex items-center justify-between border-b px-6 py-4">
            <div className="text-left">
              <p className="text-xs uppercase tracking-wide opacity-50">Practice Paper</p>
              <p className="mt-0.5 font-semibold">AQA Chemistry – Paper 2 (2023)</p>
            </div>
            <div className="rounded-full px-3 py-1 text-sm font-mono font-medium" style={{ background: "var(--background)" }}>
              ⏱ 44:12
            </div>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs uppercase tracking-wide opacity-50 mb-3">Question 4b</p>
            <p className="text-sm leading-relaxed opacity-80">
              Explain why sodium chloride dissolves in water but does not conduct electricity in solid form. <span className="opacity-50">[3 marks]</span>
            </p>
            <div className="mt-4 min-h-[72px] rounded-xl border px-4 py-3 text-sm opacity-40 italic" style={{ background: "var(--background)" }}>
              Student answer appears here…
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs opacity-40">4 of 10 answered</span>
              <div className="h-1.5 w-40 overflow-hidden rounded-full" style={{ background: "var(--background)" }}>
                <div className="h-full w-[40%] rounded-full" style={{ background: "var(--highlight)" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats row ── */}
      <section style={{ background: "var(--foreground)", color: "var(--background)" }} className="py-12">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <p className="font-[family-name:var(--font-arima-madurai)] text-4xl font-bold" style={{ color: "var(--highlight)" }}>
                {s.value}
              </p>
              <p className="mt-2 text-sm opacity-70">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.n} className="rounded-2xl border p-6" style={{ background: "var(--emphasis)" }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="font-[family-name:var(--font-arima-madurai)] text-3xl font-bold opacity-20">{s.n}</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ background: "var(--background)" }}>
                  {s.who}
                </span>
              </div>
              <p className="mb-2 font-semibold">{s.title}</p>
              <p className="text-sm opacity-70 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Analytics dashboard preview ── */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-2xl border p-8" style={{ background: "var(--emphasis)" }}>
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Student Analytics Dashboard</h2>
              <p className="mt-1 text-sm opacity-60">Tutors select which papers to include – and choose whether the student can see their own dashboard.</p>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="rounded-full border px-3 py-1" style={{ background: "var(--background)" }}>Aiden R.</span>
              <span className="rounded-full px-3 py-1 text-[var(--background)]" style={{ background: "var(--highlight)" }}>Shared ✓</span>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide opacity-50">Score Progression</p>
          <div className="flex items-end gap-3 h-32 mb-8">
            {improvementData.map((d) => (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-xs font-semibold opacity-70">{d.score}%</span>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: `${(d.score / maxScore) * 96}px`,
                    background: `color-mix(in srgb, var(--highlight) ${40 + (d.score / maxScore) * 60}%, var(--foreground))`,
                  }}
                />
                <span className="text-xs opacity-50">{d.label}</span>
              </div>
            ))}
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide opacity-50">Time per Question – Paper 6</p>
          <div className="flex items-end gap-3 h-24 mb-8">
            {questionTimings.map((d) => (
              <div key={d.q} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md"
                  style={{
                    height: `${(d.mins / maxMins) * 72}px`,
                    background: d.mins > 6 ? "var(--highlight)" : "var(--foreground)",
                    opacity: d.mins > 6 ? 1 : 0.4,
                  }}
                />
                <span className="text-xs opacity-50">{d.q}</span>
              </div>
            ))}
          </div>
          <p className="text-xs opacity-40">Bars in amber = questions where the student spent significantly longer than average.</p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-xl border p-4" style={{ background: "var(--background)" }}>
              <p className="text-xs uppercase tracking-wide opacity-50 mb-1">Calculator Papers</p>
              <p className="font-[family-name:var(--font-arima-madurai)] text-3xl font-bold">74%</p>
              <p className="text-xs opacity-50 mt-1">avg. across 4 papers</p>
            </div>
            <div className="rounded-xl border p-4" style={{ background: "var(--background)" }}>
              <p className="text-xs uppercase tracking-wide opacity-50 mb-1">Non-Calculator Papers</p>
              <p className="font-[family-name:var(--font-arima-madurai)] text-3xl font-bold" style={{ color: "var(--highlight)" }}>58%</p>
              <p className="text-xs opacity-50 mt-1">avg. across 4 papers</p>
            </div>
          </div>
          <p className="mt-3 text-xs opacity-40 italic">* Simulated for illustration purposes.</p>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section style={{ background: "var(--foreground)", color: "var(--background)" }} className="py-24">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">Everything in One Place</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: "⏱", title: "Live Countdown", body: "Auto-submits when time expires. Every question is individually timed so you can spot where students slow down." },
              { icon: "✏️", title: "PDF Annotation", body: "Mark directly on the paper. Circle, cross, comment – just like a red pen." },
              { icon: "📤", title: "Scan Upload", body: "Students can write on paper and photograph their answers to upload." },
              { icon: "🔗", title: "Invites & Accounts", body: "One-click invites for a quick start, or full student accounts for a history of every paper they've ever sat." },
              { icon: "📊", title: "Analytics Dashboard", body: "Select papers, build a visual report. Marks, timings, and subject-specific breakdowns – e.g. calculator vs non-calculator." },
              { icon: "🔓", title: "Tutor-Controlled Sharing", body: "Choose whether a student can see their own dashboard. Share the full picture when they're ready for it." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl p-6" style={{ background: "rgba(255,255,255,0.05)" }}>
                <div className="mb-3 text-2xl">{f.icon}</div>
                <p className="mb-1 font-semibold">{f.title}</p>
                <p className="text-sm opacity-60 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="mb-12 text-center text-3xl font-bold">What People Say</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border p-6 flex flex-col justify-between" style={{ background: "var(--emphasis)" }}>
              <p className="text-sm leading-relaxed opacity-80 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs opacity-50">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-5xl px-6 pb-24 text-center">
        <div className="rounded-3xl border px-8 py-16" style={{ background: "var(--emphasis)" }}>
          <h2 className="text-4xl font-bold">Ready to Run Your First Mock?</h2>
          <p className="mx-auto mt-4 max-w-md opacity-60">
            Set up your first paper in under five minutes.
          </p>
          <a
            href={`${APP_URL}/login`}
            className="mt-8 inline-block rounded-full px-10 py-3 font-semibold text-[var(--background)] transition-opacity hover:opacity-80"
            style={{ background: "var(--foreground)" }}
          >
            Enquire Now
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8 text-center text-xs opacity-40">
        <p>© {new Date().getFullYear()} Proctorly · Remote Practice Exam Platform</p>
      </footer>
    </div>
  );
}
