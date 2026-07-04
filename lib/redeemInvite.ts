import { prisma } from "@/lib/prisma";
import { setTuteeSession } from "@/lib/tuteeSession";
import { notFound, redirect } from "next/navigation";

export const CONSENT_VERSION = "v1";

export async function loadInvite(token: string) {
  const invite = await prisma.inviteLink.findUnique({ where: { token }, include: { tutee: true } });
  if (!invite || invite.revokedAt) notFound();
  if (invite.expiresAt && invite.expiresAt < new Date()) notFound();
  return invite;
}

// Creates (or reuses) the Attempt for this invite, establishes the tutee
// session, and redirects into the exam. Assumes consent has already been
// recorded — callers must check that first.
export async function redeemInvite(invite: { id: string; tuteeId: string; paperId: string; bufferSecs: number }) {
  let attempt = await prisma.attempt.findUnique({ where: { inviteLinkId: invite.id } });
  if (!attempt) {
    attempt = await prisma.attempt.create({
      data: {
        inviteLinkId: invite.id,
        tuteeId: invite.tuteeId,
        paperId: invite.paperId,
        bufferSecs: invite.bufferSecs,
      },
    });
    await prisma.inviteLink.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
  }

  await setTuteeSession(invite.tuteeId);
  redirect(`/exam/${attempt.id}`);
}
