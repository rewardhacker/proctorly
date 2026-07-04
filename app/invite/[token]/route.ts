import { prisma } from "@/lib/prisma";
import { loadInvite, redeemInvite } from "@/lib/redeemInvite";
import { redirect } from "next/navigation";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invite = await loadInvite(token);

  const consent = await prisma.consentRecord.findFirst({ where: { tuteeId: invite.tuteeId } });
  if (!consent) redirect(`/consent/${token}`);

  await redeemInvite(invite);
}
