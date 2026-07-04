"use server";

import crypto from "crypto";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { assertValidFile } from "@/lib/storage/validate";
import { getTuteeSession } from "@/lib/tuteeSession";
import { resolveAttemptState } from "@/lib/timer/resolveAttemptState";
import { notifySubmission, notifyIssueReport } from "@/lib/notifications";
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

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function createPaper(formData: FormData) {
  const tutorId = await requireTutorId();
  const title = formData.get("title") as string;
  const subject = (formData.get("subject") as string) || null;
  const defaultDurationMins = Number(formData.get("defaultDurationMins"));
  const numQuestions = Math.max(1, Number(formData.get("numQuestions")) || 1);
  const paperFile = formData.get("paperFile") as File;
  const markSchemeFile = formData.get("markSchemeFile") as File;

  try {
    assertValidFile(paperFile);
    assertValidFile(markSchemeFile);

    const paperKey = `papers/${crypto.randomUUID()}.pdf`;
    const msKey = `papers/${crypto.randomUUID()}.pdf`;
    await storage.put(paperKey, Buffer.from(await paperFile.arrayBuffer()), paperFile.type);
    await storage.put(msKey, Buffer.from(await markSchemeFile.arrayBuffer()), markSchemeFile.type);

    await prisma.paper.create({
      data: {
        tutorId,
        title,
        subject,
        defaultDurationMins,
        numQuestions,
        paperFileKey: paperKey,
        paperFileSize: paperFile.size,
        markSchemeFileKey: msKey,
        markSchemeFileSize: markSchemeFile.size,
      },
    });
  } catch (err) {
    redirect(`/tutor/papers/new?error=${encodeURIComponent(friendlyMessage(err, "Could not upload paper. Please try again."))}`);
  }

  revalidatePath("/tutor/papers");
  redirect(`/tutor/papers?success=${encodeURIComponent(`"${title}" was uploaded.`)}`);
}

export async function createTutee(formData: FormData) {
  const tutorId = await requireTutorId();
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  try {
    await prisma.tutee.create({ data: { name, email, createdByTutorId: tutorId } });
  } catch (err) {
    redirect(`/tutor/tutees?error=${encodeURIComponent(friendlyMessage(err, "Could not create tutee. Please try again."))}`);
  }

  revalidatePath("/tutor/tutees");
  redirect(`/tutor/tutees?success=${encodeURIComponent(`${name} was added.`)}`);
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

export async function uploadScans(attemptId: string, formData: FormData) {
  const attempt = await getOwnAttempt(attemptId);
  if (attempt.status !== "UPLOAD_BUFFER") throw new Error("Upload window has closed");

  const files = formData.getAll("scans") as File[];
  const keys: string[] = [];
  for (const file of files) {
    assertValidFile(file);
    const key = `scans/${attemptId}/${crypto.randomUUID()}-${file.name}`;
    await storage.put(key, Buffer.from(await file.arrayBuffer()), file.type);
    keys.push(key);
  }

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

export async function gradeAttempt(formData: FormData) {
  const tutorId = await requireTutorId();
  const attemptId = formData.get("attemptId") as string;
  const score = Number(formData.get("score"));
  const maxScore = Number(formData.get("maxScore"));
  const overallComment = (formData.get("overallComment") as string) || null;

  try {
    await prisma.attempt.findFirstOrThrow({
      where: { id: attemptId, paper: { tutorId } },
    });

    await prisma.grade.upsert({
      where: { attemptId },
      update: { score, maxScore, overallComment, gradedAt: new Date(), gradedByTutorId: tutorId },
      create: { attemptId, score, maxScore, overallComment, gradedAt: new Date(), gradedByTutorId: tutorId },
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
