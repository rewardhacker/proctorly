import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { auth } from "@/lib/auth";
import { getTuteeSession } from "@/lib/tuteeSession";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");
  const session = await auth();

  if (key.startsWith("scans/")) {
    const attemptId = keyParts[1];
    const attempt = await prisma.attempt.findFirst({
      where: { id: attemptId },
      include: { paper: true },
    });
    if (!attempt) return new Response("Not found", { status: 404 });
    if (session?.user?.id === attempt.paper.tutorId) return serve(key);

    const tutee = await getTuteeSession();
    if (tutee?.tuteeId === attempt.tuteeId) return serve(key);
    return new Response("Forbidden", { status: 403 });
  }

  const paper = await prisma.paper.findFirst({
    where: { OR: [{ paperFileKey: key }, { markSchemeFileKey: key }] },
  });
  if (!paper) return new Response("Not found", { status: 404 });

  if (session?.user?.id === paper.tutorId) return serve(key);

  const tutee = await getTuteeSession();
  if (tutee) {
    const attempt = await prisma.attempt.findFirst({
      where: { tuteeId: tutee.tuteeId, paperId: paper.id },
    });
    if (attempt && key === paper.paperFileKey && attempt.status !== "PENDING") return serve(key);
    // Mark scheme is tutor-only — never served to tutees
  }

  return new Response("Forbidden", { status: 403 });
}

function contentTypeFor(key: string) {
  if (key.endsWith(".png")) return "image/png";
  if (key.endsWith(".jpg") || key.endsWith(".jpeg")) return "image/jpeg";
  return "application/pdf";
}

async function serve(key: string) {
  const data = await storage.read(key);
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": contentTypeFor(key) },
  });
}
