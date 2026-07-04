import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

export async function notifySubmission(attemptId: string) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paper: { include: { tutor: true } }, tutee: true },
  });
  if (!attempt) return;

  await sendEmail(
    attempt.paper.tutor.email,
    `${attempt.tutee.name} submitted "${attempt.paper.title}"`,
    `${attempt.tutee.name} has submitted their attempt at "${attempt.paper.title}".\n\nReview it at /tutor/attempts/${attempt.id}`,
  );
}

export async function notifyIssueReport(attemptId: string, message: string | null) {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { paper: { include: { tutor: true } }, tutee: true },
  });
  if (!attempt) return;

  await sendEmail(
    attempt.paper.tutor.email,
    `Issue reported by ${attempt.tutee.name} during "${attempt.paper.title}"`,
    `${attempt.tutee.name} reported a technical issue during their attempt at "${attempt.paper.title}".\n\n` +
      `Message: ${message || "(no message provided)"}\n\n` +
      `Review the dispute log at /tutor/attempts/${attempt.id}`,
  );
}
