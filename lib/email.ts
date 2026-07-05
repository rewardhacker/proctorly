import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Exam Practice <onboarding@resend.dev>";

// ponytail: falls back to console logging when RESEND_API_KEY isn't set,
// so email-triggering flows (submission alerts, report-issue) work in dev
// without needing a Resend account yet. Set RESEND_API_KEY to go live.
// ponytail: NOTIFY_EMAIL overrides the tutor's own email as the recipient.
// Needed while Resend is on a free plan with no verified domain — Resend
// only delivers to the account owner's email, so point that here.
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL;

export async function sendEmail(to: string, subject: string, text: string) {
  const recipient = NOTIFY_EMAIL ?? to;
  if (!resend) {
    console.log(`[email stub] to=${recipient} subject="${subject}"\n${text}`);
    return;
  }
  await resend.emails.send({ from: FROM, to: recipient, subject, text });
}
