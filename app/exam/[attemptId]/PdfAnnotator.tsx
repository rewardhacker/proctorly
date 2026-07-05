"use client";

import { useEffect, useRef, useState } from "react";
import type { Document as DocumentType, Page as PageType } from "react-pdf";
import { saveAnnotation } from "@/lib/actions";

const RENDER_WIDTH = 600;

// react-pdf/pdfjs-dist execute browser-only code at module init time, which
// breaks Next's SSR of client components. Loading it via a runtime import()
// (only ever called from useEffect, never during render) keeps it out of
// the server bundle entirely.
type ReactPdfModule = { Document: typeof DocumentType; Page: typeof PageType };

type Stroke = [number, number][];
type Pages = Record<string, Stroke[]>;

export default function PdfAnnotator({
  attemptId,
  fileUrl,
  initialPages,
}: {
  attemptId: string;
  fileUrl: string;
  initialPages: Pages;
}) {
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNum, setPageNum] = useState(1);
  const [pages, setPages] = useState<Pages>(initialPages);
  const [canvasHeight, setCanvasHeight] = useState(RENDER_WIDTH * 1.414);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<Stroke>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageStrokes = pages[String(pageNum)] ?? [];

  useEffect(() => {
    let cancelled = false;
    import("react-pdf")
      .then(({ Document, Page, pdfjs }) => {
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
        setReactPdf({ Document, Page });
      })
      .catch((err) => {
        console.error("react-pdf load failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    for (const [x, y] of stroke.slice(1)) ctx.lineTo(x, y);
    ctx.stroke();
  }

  function redraw() {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of pageStrokes) drawStroke(ctx, stroke);
  }

  useEffect(() => {
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNum, pages, canvasHeight]);

  function scheduleSave(next: Pages) {
    setStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveAnnotation(attemptId, next);
      setStatus("saved");
    }, 800);
  }

  function point(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    currentStroke.current = [point(e)];
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    currentStroke.current.push(point(e));
    redraw();
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawStroke(ctx, currentStroke.current);
  }

  function onPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentStroke.current.length > 1) {
      const next = { ...pages, [String(pageNum)]: [...pageStrokes, currentStroke.current] };
      setPages(next);
      scheduleSave(next);
    }
    currentStroke.current = [];
  }

  function clearPage() {
    const next = { ...pages, [String(pageNum)]: [] };
    setPages(next);
    scheduleSave(next);
  }

  if (!reactPdf) {
    return <p className="mb-4 text-sm text-gray-500">Loading paper…</p>;
  }
  const { Document, Page } = reactPdf;

  return (
    <div className="mb-4">
      <div
        className="relative mb-2 rounded border"
        style={{ width: RENDER_WIDTH, height: canvasHeight }}
      >
        <Document file={fileUrl} options={{ withCredentials: true }} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
          <Page
            pageNumber={pageNum}
            width={RENDER_WIDTH}
            onLoadSuccess={(page) => setCanvasHeight(RENDER_WIDTH * (page.height / page.width))}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        <canvas
          ref={canvasRef}
          width={RENDER_WIDTH}
          height={canvasHeight}
          className="absolute left-0 top-0 touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <button
          type="button"
          onClick={() => setPageNum((n) => Math.max(1, n - 1))}
          className="rounded border px-2 py-1"
        >
          Prev
        </button>
        <span>
          Page {pageNum} / {numPages || "?"}
        </span>
        <button
          type="button"
          onClick={() => setPageNum((n) => Math.min(numPages || 1, n + 1))}
          className="rounded border px-2 py-1"
        >
          Next
        </button>
        <button type="button" onClick={clearPage} className="rounded border px-2 py-1">
          Clear Page
        </button>
        <span className="text-xs text-gray-500">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
      </div>
    </div>
  );
}
