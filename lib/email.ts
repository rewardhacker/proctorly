export async function sendEmail(to: string, subject: string, text: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[email stub] to=${to} subject="${subject}"\n${text}`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Proctorly <noreply@proctorly.com>",
      to,
      subject,
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", body);
    throw new Error(`Resend: ${body}`);
  }
}
