"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { getTuteeSession, setTuteeSession } from "@/lib/tuteeSession";
import { resolveAttemptState } from "@/lib/timer/resolveAttemptState";
import { notifySubmission, notifyIssueReport } from "@/lib/notifications";
import { sendEmail } from "@/lib/email";
import { loadInvite, redeemInvite, CONSENT_VERSION } from "@/lib/redeemInvite";
import { headers } from "next/headers";

// Turns unexpected errors into a friendly, redirect-carried flash message
// instead of letting them bubble up as an unhandled exception (which
// Next.js renders as a hard page crash for the user).
function friendlyMessage(err: unknown, fallback: string): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    const field = (err.meta?.target as string[] | undefined)?.[0];
    return field ? `That ${field} is already in use.` : "That value is already in use.";
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

export async function giveConsent(token: string, formData: FormData) {
  if (!formData.get("agree")) {
    redirect(`/consent/${token}?error=${encodeURIComponent("Please check the box to continue.")}`);
  }

  const invite = await loadInvite(token);
  const h = await headers();

  try {
    await prisma.consentRecord.create({
      data: {
        tuteeId: invite.tuteeId,
        version: CONSENT_VERSION,
        ipAddress: h.get("x-forwarded-for"),
        userAgent: h.get("user-agent"),
      },
    });
  } catch (err) {
    redirect(`/consent/${token}?error=${encodeURIComponent(friendlyMessage(err, "Could not record consent. Please try again."))}`);
  }

  await redeemInvite(invite);
}

async function requireTutorId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Not authorized");
  return session.user.id;
}

const TUTOR_POLICY_VERSION = "v1";

export async function inviteTutor(formData: FormData) {
  const adminId = await requireAdmin();
  const email = (formData.get("email") as string).trim().toLowerCase();

  const existing = await prisma.tutor.findUnique({ where: { email } });
  if (existing) redirect(`/admin?error=${encodeURIComponent("A tutor with that email already exists.")}`);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await prisma.tutorInvite.create({ data: { email, createdById: adminId, expiresAt } });

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const onboardUrl = `${protocol}://${host}/onboard/${invite.token}`;

  await sendEmail(
    email,
    "You've been invited to join Proctorly as a tutor",
    `You've been invited to set up your tutor account on Proctorly.\n\nClick the link below to get started — it expires in 7 days.\n\n${onboardUrl}\n\nIf you weren't expecting this, you can ignore this email.`,
  );

  revalidatePath("/admin");
  redirect(`/admin?success=${encodeURIComponent(`Invite sent to ${email}.`)}`);
}

export async function adminResetTutorCredentials(formData: FormData) {
  await requireAdmin();
  const tutorId = formData.get("tutorId") as string;
  const email = (formData.get("email") as string).trim().toLowerCase() || null;
  const password = (formData.get("password") as string) || null;

  if (!email && !password)
    redirect(`/admin?error=${encodeURIComponent("Provide at least an email or password.")}`);

  const data: { email?: string; passwordHash?: string } = {};
  if (email) data.email = email;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.tutor.update({ where: { id: tutorId }, data });
  } catch (err) {
    redirect(`/admin?error=${encodeURIComponent(friendlyMessage(err, "Could not update tutor credentials."))}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?success=${encodeURIComponent("Tutor credentials updated.")}`);
}

export async function adminResetTuteeCredentials(formData: FormData) {
  await requireAdmin();
  const tuteeId = formData.get("tuteeId") as string;
  const email = (formData.get("email") as string).trim().toLowerCase() || null;
  const password = (formData.get("password") as string) || null;

  if (!email && !password)
    redirect(`/admin?error=${encodeURIComponent("Provide at least an email or password.")}`);

  const data: { email?: string; passwordHash?: string } = {};
  if (email) data.email = email;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  try {
    await prisma.tutee.update({ where: { id: tuteeId }, data });
  } catch (err) {
    redirect(`/admin?error=${encodeURIComponent(friendlyMessage(err, "Could not update tutee credentials."))}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?success=${encodeURIComponent("Tutee credentials updated.")}`);
}

export async function completeTutorOnboarding(token: string, formData: FormData): Promise<{ error: string } | void> {
  const name = (formData.get("name") as string).trim();
  const password = formData.get("password") as string;
  const agreed = formData.get("agree");

  if (!name) return { error: "Name is required." };
  if (!password || password.length < 8) return { error: "Password must be at least 8 characters." };
  if (!agreed) return { error: "You must accept the policy to continue." };

  const invite = await prisma.tutorInvite.findUnique({ where: { token } });
  if (!invite || invite.usedAt || invite.expiresAt < new Date()) return { error: "This invite link is invalid or has expired." };

  const existing = await prisma.tutor.findUnique({ where: { email: invite.email } });
  if (existing) return { error: "An account with this email already exists." };

  const h = await headers();
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.tutor.create({
      data: {
        email: invite.email,
        name,
        passwordHash,
        policyVersion: TUTOR_POLICY_VERSION,
        policyConsentedAt: new Date(),
        policyIpAddress: h.get("x-forwarded-for"),
      },
    }),
    prisma.tutorInvite.update({ where: { token }, data: { usedAt: new Date() } }),
  ]);

  redirect("/login?success=Account+created.+Please+log+in.");
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

// Netlify's Next.js runtime has a known crash when a server action's
// request body is a large multipart FormData (it dies deep inside Node's
// stream cleanup before our own code runs, so no try/catch here can help).
// File bytes now go browser -> storage directly via a presigned URL; the
// server actions below only ever see small JSON payloads.
export async function beginPaperUpload(paperContentType: string, markSchemeContentType: string) {
  await requireTutorId();

  const paperFileKey = `papers/${crypto.randomUUID()}.pdf`;
  const markSchemeFileKey = `papers/${crypto.randomUUID()}.pdf`;

  const [paperUploadUrl, markSchemeUploadUrl] = await Promise.all([
    storage.getUploadUrl(paperFileKey, paperContentType),
    storage.getUploadUrl(markSchemeFileKey, markSchemeContentType),
  ]);

  return { paperFileKey, paperUploadUrl, markSchemeFileKey, markSchemeUploadUrl };
}

export async function finalizeCreatePaper(data: {
  title: string;
  subject: string | null;
  paperVariant: string | null;
  defaultDurationMins: number;
  numQuestions: number;
  paperFileKey: string;
  paperFileSize: number;
  markSchemeFileKey: string;
  markSchemeFileSize: number;
}): Promise<{ error: string } | { ok: true }> {
  const tutorId = await requireTutorId();

  try {
    await prisma.paper.create({ data: { tutorId, ...data } });
  } catch (err) {
    return { error: friendlyMessage(err, "Could not save paper. Please try again.") };
  }

  revalidatePath("/tutor/papers");
  return { ok: true };
}

export async function toggleAnalyticsSharing(formData: FormData) {
  const tutorId = await requireTutorId();
  const tuteeId = formData.get("tuteeId") as string;
  const share = formData.get("share") === "true";

  const tutee = await prisma.tutee.findFirst({ where: { id: tuteeId, createdByTutorId: tutorId } });
  if (!tutee) redirect(`/tutor/tutees?error=${encodeURIComponent("Tutee not found.")}`);

  await prisma.tutee.update({ where: { id: tuteeId }, data: { analyticsSharedWithStudent: share } });
  revalidatePath(`/tutor/analytics/${tuteeId}`);
  revalidatePath("/tutor/tutees");
}

export async function createTutee(formData: FormData) {
  const tutorId = await requireTutorId();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = (formData.get("password") as string) || null;
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;

  try {
    await prisma.tutee.create({ data: { name, email, createdByTutorId: tutorId, ...(passwordHash ? { passwordHash } : {}) } });
  } catch (err) {
    redirect(`/tutor/tutees?error=${encodeURIComponent(friendlyMessage(err, "Could not create tutee. Please try again."))}`);
  }

  revalidatePath("/tutor/tutees");
  redirect(`/tutor/tutees?success=${encodeURIComponent(`${name} was added.`)}`);
}

export async function resetTuteePassword(formData: FormData) {
  const tutorId = await requireTutorId();
  const tuteeId = formData.get("tuteeId") as string;
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    redirect(`/tutor/tutees?error=${encodeURIComponent("Password must be at least 6 characters.")}`);
  }

  const tutee = await prisma.tutee.findFirst({ where: { id: tuteeId, createdByTutorId: tutorId } });
  if (!tutee) redirect(`/tutor/tutees?error=${encodeURIComponent("Tutee not found.")}`);

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.tutee.update({ where: { id: tuteeId }, data: { passwordHash } });

  revalidatePath("/tutor/tutees");
  redirect(`/tutor/tutees?success=${encodeURIComponent(`Password updated for ${tutee.name}.`)}`);
}

export async function requestPasswordReset(formData: FormData): Promise<{ error?: string; sent?: true }> {
  const email = formData.get("email") as string;
  const tutor = await prisma.tutor.findUnique({ where: { email } });

  // Always return sent=true to avoid leaking whether the email exists
  if (!tutor) return { sent: true };

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.tutor.update({
    where: { id: tutor.id },
    data: { resetToken: token, resetTokenExpiresAt: expiresAt },
  });

  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  const resetUrl = `${protocol}://${host}/reset-password/${token}`;

  await sendEmail(
    tutor.email,
    "Reset your password",
    `Click the link below to reset your password. It expires in 1 hour.\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
  );

  return { sent: true };
}

export async function completePasswordReset(formData: FormData): Promise<{ error?: string }> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!password || password.length < 8) return { error: "Password must be at least 8 characters." };

  const tutor = await prisma.tutor.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiresAt: { gt: new Date() },
    },
  });

  if (!tutor) return { error: "This reset link is invalid or has expired." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.tutor.update({
    where: { id: tutor.id },
    data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
  });

  redirect("/login?success=Password+updated.+Please+log+in.");
}

export async function studentLogin(formData: FormData): Promise<{ error: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const tutee = await prisma.tutee.findUnique({ where: { email } });
  if (!tutee?.passwordHash) return { error: "Invalid email or password." };

  const valid = await bcrypt.compare(password, tutee.passwordHash);
  if (!valid) return { error: "Invalid email or password." };

  await setTuteeSession(tutee.id);
  redirect("/student");
}

export async function studentLogout() {
  (await cookies()).delete("tutee_session");
  redirect("/student/login");
}

export async function createInvite(formData: FormData) {
  const tutorId = await requireTutorId();
  const tuteeId = formData.get("tuteeId") as string;
  const paperId = formData.get("paperId") as string;

  try {
    const paper = await prisma.paper.findFirstOrThrow({ where: { id: paperId, tutorId } });

    await prisma.inviteLink.create({
      data: {
        tutorId,
        tuteeId,
        paperId,
        durationMins: paper.defaultDurationMins,
        bufferSecs: paper.defaultBufferSecs,
      },
    });
  } catch (err) {
    redirect(`/tutor/tutees?error=${encodeURIComponent(friendlyMessage(err, "Could not generate invite link. Please try again."))}`);
  }

  revalidatePath("/tutor/tutees");
  redirect(`/tutor/tutees?success=${encodeURIComponent("Invite link generated.")}`);
}

export async function startAttempt(attemptId: string) {
  const tutee = await getTuteeSession();
  if (!tutee) throw new Error("Not authenticated");

  const attempt = await prisma.attempt.findFirstOrThrow({
    where: { id: attemptId, tuteeId: tutee.tuteeId },
  });
  if (attempt.status !== "PENDING") return;

  const invite = await prisma.inviteLink.findUniqueOrThrow({
    where: { id: attempt.inviteLinkId },
  });

  const now = new Date();
  const durationMins = invite.durationMins + invite.manualAdjustmentMins;
  const hardEndAt = new Date(now.getTime() + durationMins * 60_000);
  const bufferEndAt = new Date(hardEndAt.getTime() + invite.bufferSecs * 1000);

  await prisma.attempt.updateMany({
    where: { id: attemptId, status: "PENDING" },
    data: {
      status: "IN_PROGRESS",
      startedAt: now,
      totalDurationMins: durationMins,
      bufferSecs: invite.bufferSecs,
      hardEndAt,
      bufferEndAt,
    },
  });

  revalidatePath(`/exam/${attemptId}`);
}

async function getOwnAttempt(attemptId: string) {
  const tutee = await getTuteeSession();
  if (!tutee) throw new Error("Not authenticated");
  const attempt = await prisma.attempt.findFirstOrThrow({
    where: { id: attemptId, tuteeId: tutee.tuteeId },
  });
  return resolveAttemptState(attempt);
}

export async function saveAnswer(attemptId: string, questionKey: string, content: Prisma.InputJsonValue) {
  const attempt = await getOwnAttempt(attemptId);
  // Real enforcement: the server clock, not the client, decides whether a
  // text/annotation write still counts. Once the hard end has passed the
  // attempt has already flipped out of IN_PROGRESS via resolveAttemptState.
  if (attempt.status !== "IN_PROGRESS") return;

  await prisma.answer.upsert({
    where: { attemptId_questionKey: { attemptId, questionKey } },
    update: { richTextJson: content, modality: "RICH_TEXT" },
    create: { attemptId, questionKey, modality: "RICH_TEXT", richTextJson: content },
  });
}

// pages: { [pageNumber]: Array<Array<[x, y]>> } — one array of strokes per
// page, each stroke an array of [x, y] points in unscaled PDF page space.
export async function saveAnnotation(attemptId: string, pages: Record<string, number[][][]>) {
  const attempt = await getOwnAttempt(attemptId);
  if (attempt.status !== "IN_PROGRESS") return;

  await prisma.answer.upsert({
    where: { attemptId_questionKey: { attemptId, questionKey: "pdf" } },
    update: { annotationJson: { pages } },
    create: { attemptId, questionKey: "pdf", modality: "PDF_ANNOTATION", annotationJson: { pages } },
  });
}

export async function toggleFlag(attemptId: string, questionKey: string) {
  const attempt = await getOwnAttempt(attemptId);
  if (attempt.status !== "IN_PROGRESS") return;

  const existing = await prisma.answer.findUnique({
    where: { attemptId_questionKey: { attemptId, questionKey } },
  });

  await prisma.answer.upsert({
    where: { attemptId_questionKey: { attemptId, questionKey } },
    update: { flagged: !existing?.flagged },
    create: {
      attemptId,
      questionKey,
      modality: "RICH_TEXT",
      flagged: true,
    },
  });

  revalidatePath(`/exam/${attemptId}`);
}

export async function submitAttempt(attemptId: string) {
  const attempt = await getOwnAttempt(attemptId);
  if (attempt.status !== "IN_PROGRESS" && attempt.status !== "UPLOAD_BUFFER") return;

  await prisma.attempt.update({
    where: { id: attemptId },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      markSchemeReleasedAt: new Date(),
    },
  });
  await prisma.activityLog.create({
    data: { attemptId, event: "SUBMITTED" },
  });
  await notifySubmission(attemptId);

  revalidatePath(`/exam/${attemptId}`);
}

export async function reportIssue(attemptId: string, message: string) {
  const tutee = await getTuteeSession();
  if (!tutee) throw new Error("Not authenticated");

  await prisma.attempt.findFirstOrThrow({
    where: { id: attemptId, tuteeId: tutee.tuteeId },
  });

  await prisma.issueReport.create({
    data: { attemptId, message, emailedAt: new Date() },
  });
  await notifyIssueReport(attemptId, message);
}

function attemptChildDeletes(attemptId: string | string[]) {
  const where = Array.isArray(attemptId) ? { attemptId: { in: attemptId } } : { attemptId };
  return [
    prisma.grade.deleteMany({ where }),
    prisma.issueReport.deleteMany({ where }),
    prisma.activityLog.deleteMany({ where }),
    prisma.focusEvent.deleteMany({ where }),
    prisma.answer.deleteMany({ where }),
  ];
}

const FOCUS_EVENT_TYPES = [
  "BLUR",
  "FOCUS",
  "VISIBILITY_HIDDEN",
  "VISIBILITY_VISIBLE",
  "COPY_ATTEMPT",
  "PASTE_ATTEMPT",
  "CONTEXT_MENU_ATTEMPT",
] as const;
type FocusEventType = (typeof FOCUS_EVENT_TYPES)[number];

// Best-effort, client-reported signal — see docs/plan notes. The server
// only guarantees it can't be silently suppressed once reported (it
// timestamps arrival itself), not that every real tab-switch is caught.
export async function logFocusEvent(
  attemptId: string,
  type: FocusEventType,
  clientTimestamp: string,
  durationMs?: number,
) {
  const tutee = await getTuteeSession();
  if (!tutee) return;

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, tuteeId: tutee.tuteeId },
  });
  if (!attempt || (attempt.status !== "IN_PROGRESS" && attempt.status !== "UPLOAD_BUFFER")) return;

  await prisma.focusEvent.create({
    data: { attemptId, type, clientTimestamp: new Date(clientTimestamp), durationMs },
  });
}

// Same reasoning as beginPaperUpload/finalizeCreatePaper: no file bytes
// through the server action, just presigned URLs.
export async function beginScanUpload(
  attemptId: string,
  files: { name: string; contentType: string }[],
) {
  const attempt = await getOwnAttempt(attemptId);
  if (attempt.status !== "UPLOAD_BUFFER" && attempt.status !== "IN_PROGRESS") throw new Error("Upload window has closed");

  return Promise.all(
    files.map(async (f) => {
      const key = `scans/${attemptId}/${crypto.randomUUID()}-${f.name}`;
      const uploadUrl = await storage.getUploadUrl(key, f.contentType);
      return { key, uploadUrl };
    }),
  );
}

export async function finalizeScanUpload(attemptId: string, keys: string[]) {
  const attempt = await getOwnAttempt(attemptId);
  if (attempt.status !== "UPLOAD_BUFFER" && attempt.status !== "IN_PROGRESS") throw new Error("Upload window has closed");

  const existing = await prisma.answer.findUnique({
    where: { attemptId_questionKey: { attemptId, questionKey: "scan" } },
  });

  await prisma.answer.upsert({
    where: { attemptId_questionKey: { attemptId, questionKey: "scan" } },
    update: { scanFileKeys: [...(existing?.scanFileKeys ?? []), ...keys] },
    create: { attemptId, questionKey: "scan", modality: "SCANNED_UPLOAD", scanFileKeys: keys },
  });

  revalidatePath(`/exam/${attemptId}`);
}

export async function deleteInvite(formData: FormData) {
  const tutorId = await requireTutorId();
  const inviteId = formData.get("inviteId") as string;

  const invite = await prisma.inviteLink.findFirst({
    where: { id: inviteId, tutorId },
    include: { attempt: { select: { id: true } } },
  });
  if (!invite) redirect(`/tutor/tutees?error=${encodeURIComponent("Invite not found.")}`);

  if (invite.attempt) {
    const attemptId = invite.attempt.id;
    await prisma.$transaction([
      ...attemptChildDeletes(attemptId),
      prisma.attempt.delete({ where: { id: attemptId } }),
      prisma.inviteLink.delete({ where: { id: inviteId } }),
    ]);
  } else {
    await prisma.inviteLink.delete({ where: { id: inviteId } });
  }

  revalidatePath("/tutor/tutees");
  redirect(`/tutor/tutees?success=${encodeURIComponent("Invite link deleted.")}`);
}

export async function revokeInvite(formData: FormData) {
  const tutorId = await requireTutorId();
  const inviteId = formData.get("inviteId") as string;

  const invite = await prisma.inviteLink.findFirst({ where: { id: inviteId, tutorId } });
  if (!invite) redirect(`/tutor/tutees?error=${encodeURIComponent("Invite not found.")}`);

  await prisma.inviteLink.update({ where: { id: inviteId }, data: { revokedAt: new Date() } });

  revalidatePath("/tutor/tutees");
  redirect(`/tutor/tutees?success=${encodeURIComponent("Invite link revoked. Submissions are preserved.")}`);
}

export async function deleteTutee(formData: FormData) {
  const tutorId = await requireTutorId();
  const tuteeId = formData.get("tuteeId") as string;

  const tutee = await prisma.tutee.findFirst({ where: { id: tuteeId, createdByTutorId: tutorId } });
  if (!tutee) redirect(`/tutor/tutees?error=${encodeURIComponent("Student not found.")}`);

  const attempts = await prisma.attempt.findMany({ where: { tuteeId }, select: { id: true } });
  const attemptIds = attempts.map((a) => a.id);

  await prisma.$transaction([
    ...attemptChildDeletes(attemptIds),
    prisma.attempt.deleteMany({ where: { id: { in: attemptIds } } }),
    prisma.inviteLink.deleteMany({ where: { tuteeId } }),
    prisma.consentRecord.deleteMany({ where: { tuteeId } }),
    prisma.tutee.delete({ where: { id: tuteeId } }),
  ]);

  revalidatePath("/tutor/tutees");
  redirect(`/tutor/tutees?success=${encodeURIComponent(`${tutee.name} deleted.`)}`);
}

export async function deletePaper(formData: FormData) {
  const tutorId = await requireTutorId();
  const paperId = formData.get("paperId") as string;

  const paper = await prisma.paper.findFirst({ where: { id: paperId, tutorId } });
  if (!paper) redirect(`/tutor/papers?error=${encodeURIComponent("Paper not found.")}`);

  // Cascade delete all related records
  const attempts = await prisma.attempt.findMany({ where: { paperId }, select: { id: true } });
  const attemptIds = attempts.map((a) => a.id);

  await prisma.$transaction([
    ...attemptChildDeletes(attemptIds),
    prisma.attempt.deleteMany({ where: { id: { in: attemptIds } } }),
    prisma.inviteLink.deleteMany({ where: { paperId } }),
    prisma.paper.delete({ where: { id: paperId } }),
  ]);

  revalidatePath("/tutor/papers");
  redirect(`/tutor/papers?success=${encodeURIComponent("Paper deleted.")}`);
}

export async function deleteAttempt(formData: FormData) {
  const tutorId = await requireTutorId();
  const attemptId = formData.get("attemptId") as string;

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, paper: { tutorId } },
    select: { id: true, inviteLinkId: true },
  });
  if (!attempt) redirect(`/tutor/attempts?error=${encodeURIComponent("Submission not found.")}`);

  await prisma.$transaction([
    ...attemptChildDeletes(attemptId),
    prisma.attempt.delete({ where: { id: attemptId } }),
    prisma.inviteLink.update({ where: { id: attempt.inviteLinkId }, data: { usedAt: null } }),
  ]);

  revalidatePath("/tutor/attempts");
  redirect(`/tutor/attempts?success=${encodeURIComponent("Submission deleted.")}`);
}

export async function resetAttempt(formData: FormData) {
  const tutorId = await requireTutorId();
  const attemptId = formData.get("attemptId") as string;

  const attempt = await prisma.attempt.findFirst({
    where: { id: attemptId, paper: { tutorId } },
    select: { id: true, inviteLinkId: true },
  });
  if (!attempt) redirect(`/tutor/attempts?error=${encodeURIComponent("Submission not found.")}`);

  await prisma.$transaction([
    ...attemptChildDeletes(attemptId),
    prisma.attempt.update({
      where: { id: attemptId },
      data: {
        status: "PENDING",
        startedAt: null,
        totalDurationMins: null,
        hardEndAt: null,
        bufferEndAt: null,
        submittedAt: null,
        autoSubmitted: false,
        markSchemeReleasedAt: null,
        purgeAfter: null,
        purgedAt: null,
      },
    }),
    prisma.inviteLink.update({ where: { id: attempt.inviteLinkId }, data: { usedAt: null } }),
  ]);

  revalidatePath("/tutor/attempts");
  redirect(`/tutor/attempts?success=${encodeURIComponent("Submission reset to pending.")}`);
}

export async function saveTutorAnnotation(
  attemptId: string,
  pages: Record<string, number[][][]>,
  highlightPages: Record<string, number[][][]> = {},
  scanPages: Record<string, Record<string, number[][][]>> = {},
  scanHighlightPages: Record<string, Record<string, number[][][]>> = {},
  renderWidth = 600,
) {
  const tutorId = await requireTutorId();
  await prisma.attempt.findFirstOrThrow({ where: { id: attemptId, paper: { tutorId } } });
  await prisma.attempt.update({
    where: { id: attemptId },
    data: { tutorAnnotationJson: { pages, highlightPages, scanPages, scanHighlightPages, renderWidth } },
  });
}

export async function beginTutorScanUpload(
  attemptId: string,
  files: { name: string; contentType: string }[],
) {
  const tutorId = await requireTutorId();
  await prisma.attempt.findFirstOrThrow({ where: { id: attemptId, paper: { tutorId } } });
  return Promise.all(
    files.map(async (f) => {
      const key = `scans/${attemptId}/${crypto.randomUUID()}-${f.name}`;
      const uploadUrl = await storage.getUploadUrl(key, f.contentType);
      return { key, uploadUrl };
    }),
  );
}

export async function finalizeTutorScanUpload(attemptId: string, keys: string[]) {
  const tutorId = await requireTutorId();
  await prisma.attempt.findFirstOrThrow({ where: { id: attemptId, paper: { tutorId } } });

  const existing = await prisma.answer.findUnique({
    where: { attemptId_questionKey: { attemptId, questionKey: "scan" } },
  });

  await prisma.answer.upsert({
    where: { attemptId_questionKey: { attemptId, questionKey: "scan" } },
    update: { scanFileKeys: [...(existing?.scanFileKeys ?? []), ...keys] },
    create: { attemptId, questionKey: "scan", modality: "SCANNED_UPLOAD", scanFileKeys: keys },
  });

  revalidatePath(`/tutor/attempts/${attemptId}`);
}

export async function gradeAttempt(formData: FormData) {
  const tutorId = await requireTutorId();
  const attemptId = formData.get("attemptId") as string;
  const score = Number(formData.get("score"));
  const maxScore = Number(formData.get("maxScore"));
  const overallComment = (formData.get("overallComment") as string) || null;
  const perQuestionRaw = formData.get("perQuestionJson") as string | null;
  const feedbackJson = perQuestionRaw ? { questions: JSON.parse(perQuestionRaw) } : undefined;

  try {
    await prisma.attempt.findFirstOrThrow({
      where: { id: attemptId, paper: { tutorId } },
    });

    await prisma.grade.upsert({
      where: { attemptId },
      update: { score, maxScore, overallComment, gradedAt: new Date(), gradedByTutorId: tutorId, ...(feedbackJson ? { feedbackJson } : {}) },
      create: { attemptId, score, maxScore, overallComment, gradedAt: new Date(), gradedByTutorId: tutorId, ...(feedbackJson ? { feedbackJson } : {}) },
    });

    const retentionDays = Number(process.env.RETENTION_DAYS ?? 90);
    const gradedAt = new Date();
    const purgeAfter = new Date(gradedAt.getTime() + retentionDays * 24 * 60 * 60 * 1000);

    await prisma.attempt.update({
      where: { id: attemptId },
      data: { status: "GRADED", purgeAfter },
    });
  } catch (err) {
    redirect(`/tutor/attempts/${attemptId}?error=${encodeURIComponent(friendlyMessage(err, "Could not save grade. Please try again."))}`);
  }

  revalidatePath("/tutor/attempts");
  redirect(`/tutor/attempts?success=${encodeURIComponent("Grade saved.")}`);
}
