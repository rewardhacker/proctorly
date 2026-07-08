import nodemailer from "nodemailer";

// Outlook SMTP — set SMTP_USER and SMTP_PASS in env vars.
// ponytail: falls back to console logging when SMTP_USER isn't set.
export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[email stub] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp-mail.outlook.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10_000,
    socketTimeout: 10_000,
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
  });

  if (info.rejected.length > 0) {
    throw new Error(`Email rejected by SMTP for: ${info.rejected.join(", ")}`);
  }
}
