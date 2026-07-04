import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Exam Practice <onboarding@resend.dev>";

// ponytail: falls back to console logging when RESEND_API_KEY isn't set,
// so email-triggering flows (submission alerts, report-issue) work in dev
// without needing a Resend account yet. Set RESEND_API_KEY to go live.
export async function sendEmail(to: string, subject: string, text: string) {
  if (!resend) {
    console.log(`[email stub] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, text });
}
