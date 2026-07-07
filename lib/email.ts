import { BrevoClient } from "@getbrevo/brevo";

const FROM_EMAIL = process.env.EMAIL_FROM ?? "jakaria@live.co.uk";
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? "Proctorly";

// ponytail: falls back to console logging when BREVO_API_KEY isn't set.
export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.BREVO_API_KEY) {
    console.log(`[email stub] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const client = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });
  await client.transactionalEmails.sendTransacEmail({
    sender: { email: FROM_EMAIL, name: FROM_NAME },
    to: [{ email: to }],
    subject,
    textContent: text,
  });
}
