import { Resend } from "resend";

// ponytail: single Resend instance; swap RESEND_FROM for a verified domain sender later.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail(to: string, subject: string, text: string) {
  if (!resend) {
    console.log(`[email stub] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? "onboarding@resend.dev",
    to,
    subject,
    text,
  });

  if (error) throw new Error(`Resend error: ${error.message}`);
}
