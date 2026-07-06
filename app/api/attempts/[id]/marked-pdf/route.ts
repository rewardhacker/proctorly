import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { PDFDocument, rgb } from "pdf-lib";

type Stroke = [number, number][];
type Pages = Record<string, Stroke[]>;

function drawStrokesOnPage(
  page: { drawLine: (opts: object) => void; getWidth: () => number; getHeight: () => number },
  strokes: Stroke[],
  renderWidth: number,
  color: { r: number; g: number; b: number },
) {
  const pdfW = page.getWidth();
  const pdfH = page.getHeight();
  const scale = pdfW / renderWidth;

  for (const stroke of strokes) {
    if (stroke.length < 2) continue;
    for (let i = 0; i < stroke.length - 1; i++) {
      const [x1, y1] = stroke[i];
      const [x2, y2] = stroke[i + 1];
      page.drawLine({
        start: { x: x1 * scale, y: pdfH - y1 * scale },
        end:   { x: x2 * scale, y: pdfH - y2 * scale },
        thickness: 2,
        color: rgb(color.r, color.g, color.b),
        opacity: 0.85,
      });
    }
  }
}

async function applyAnnotations(
  pdfBytes: Buffer,
  pages: Pages,
  highlightPages: Pages,
  renderWidth: number,
) {
  const doc = await PDFDocument.load(pdfBytes);
  const pdfPages = doc.getPages();
  const red = { r: 0.86, g: 0.15, b: 0.15 };

  for (const [pageStr, strokes] of Object.entries(pages)) {
    const pageIdx = parseInt(pageStr) - 1;
    if (pageIdx < 0 || pageIdx >= pdfPages.length || !strokes.length) continue;
    drawStrokesOnPage(pdfPages[pageIdx], strokes, renderWidth, red);
  }

  for (const [pageStr, strokes] of Object.entries(highlightPages)) {
    const pageIdx = parseInt(pageStr) - 1;
    if (pageIdx < 0 || pageIdx >= pdfPages.length || !strokes.length) continue;
    const p = pdfPages[pageIdx];
    const pdfW = p.getWidth();
    const pdfH = p.getHeight();
    const scale = pdfW / renderWidth;
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      for (let i = 0; i < stroke.length - 1; i++) {
        const [x1, y1] = stroke[i];
        const [x2, y2] = stroke[i + 1];
        p.drawLine({
          start: { x: x1 * scale, y: pdfH - y1 * scale },
          end:   { x: x2 * scale, y: pdfH - y2 * scale },
          thickness: 16 * scale,
          color: rgb(0.98, 0.63, 0.07),
          opacity: 0.35,
        });
      }
    }
  }

  return Buffer.from(await doc.save());
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return new Response("Forbidden", { status: 403 });

  const attempt = await prisma.attempt.findFirst({
    where: { id, paper: { tutorId: session.user.id } },
    include: { paper: true, tutee: true },
  });
  if (!attempt) return new Response("Not found", { status: 404 });

  const annotJson = attempt.tutorAnnotationJson as {
    pages?: Pages;
    highlightPages?: Pages;
    renderWidth?: number;
  } | null;

  const pages = annotJson?.pages ?? {};
  const highlightPages = annotJson?.highlightPages ?? {};
  const renderWidth = annotJson?.renderWidth ?? 600;

  const paperBytes = await storage.read(attempt.paper.paperFileKey);
  const markedBytes = await applyAnnotations(paperBytes, pages, highlightPages, renderWidth);

  const filename = `${attempt.tutee.name}_${attempt.paper.title}_marked.pdf`
    .replace(/[^a-z0-9_.\- ]/gi, "_");

  return new Response(markedBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
