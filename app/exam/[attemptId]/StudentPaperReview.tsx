"use client";

import { useEffect, useRef, useState } from "react";
import type { Document as DocumentType, Page as PageType } from "react-pdf";

type ReactPdfModule = { Document: typeof DocumentType; Page: typeof PageType };
type Stroke = [number, number][];
type Pages = Record<string, Stroke[]>;

const RENDER_WIDTH = 600;
const NAV_BTN = "rounded bg-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-300 disabled:opacity-40 text-sm";

export default function StudentPaperReview({
  fileUrl,
  studentAnnotationPages,
  tutorAnnotationPages,
  tutorHighlightPages = {},
  storedRenderWidth = 600,
}: {
  fileUrl: string;
  studentAnnotationPages: Pages;
  tutorAnnotationPages: Pages;
  tutorHighlightPages?: Pages;
  storedRenderWidth?: number;
}) {
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [pdfBlob, setPdfBlob] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(RENDER_WIDTH * 1.414);
  const studentCanvasRef = useRef<HTMLCanvasElement>(null);
  const tutorCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    import("react-pdf").then(({ Document, Page, pdfjs }) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdf({ Document, Page });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let objectUrl: string;
    fetch(fileUrl)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
      .then((blob) => { objectUrl = URL.createObjectURL(blob); setPdfBlob(objectUrl); })
      .catch((err: unknown) => setLoadError(`Failed to load PDF. (${err instanceof Error ? err.message : String(err)})`));
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [fileUrl]);

  useEffect(() => {
    const ctx = studentCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const strokes = studentAnnotationPages[String(page)] ?? [];
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (const [x, y] of stroke.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [page, studentAnnotationPages, canvasHeight]);

  useEffect(() => {
    const ctx = tutorCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    // storedRenderWidth=1 means normalized [0,1] coords; otherwise absolute pixels at storedRenderWidth
    const scale = storedRenderWidth === 1 ? RENDER_WIDTH : RENDER_WIDTH / storedRenderWidth;
    // Highlights first
    const highlights = tutorHighlightPages[String(page)] ?? [];
    if (highlights.length) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      for (const stroke of highlights) {
        if (stroke.length < 2) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0][0] * scale, stroke[0][1] * scale);
        for (const [x, y] of stroke.slice(1)) ctx.lineTo(x * scale, y * scale);
        ctx.stroke();
      }
      ctx.restore();
    }
    // Strokes on top
    const strokes = tutorAnnotationPages[String(page)] ?? [];
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of strokes) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0] * scale, stroke[0][1] * scale);
      for (const [x, y] of stroke.slice(1)) ctx.lineTo(x * scale, y * scale);
      ctx.stroke();
    }
  }, [page, tutorAnnotationPages, tutorHighlightPages, canvasHeight, storedRenderWidth]);

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>;
  if (!reactPdf || !pdfBlob) return <p className="text-sm text-gray-500">Loading paper…</p>;

  const { Document, Page } = reactPdf;
  const hasTutorMarks = Object.keys(tutorAnnotationPages).length > 0 || Object.keys(tutorHighlightPages).length > 0;

  return (
    <div className="mb-4">
      <div className="relative mb-2 rounded border" style={{ width: RENDER_WIDTH, height: canvasHeight }}>
        <Document file={pdfBlob} onLoadSuccess={({ numPages: n }) => setNumPages(n)}>
          <Page
            pageNumber={page}
            width={RENDER_WIDTH}
            onLoadSuccess={(p) => setCanvasHeight(RENDER_WIDTH * (p.height / p.width))}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        <canvas ref={studentCanvasRef} width={RENDER_WIDTH} height={canvasHeight}
          className="pointer-events-none absolute left-0 top-0" />
        <canvas ref={tutorCanvasRef} width={RENDER_WIDTH} height={canvasHeight}
          className="pointer-events-none absolute left-0 top-0" />
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
          className={NAV_BTN}>Prev</button>
        <span className="text-sm">Page {page} / {numPages || "?"}</span>
        <button type="button" onClick={() => setPage((p) => Math.min(numPages || p, p + 1))} disabled={page >= numPages}
          className={NAV_BTN}>Next</button>
        {hasTutorMarks && (
          <>
            <span className="text-xs text-blue-600">&#9679; Your annotations</span>
            <span className="text-xs text-red-600">&#9679; Tutor marks</span>
            <span className="text-xs text-amber-500">&#9679; Highlights</span>
          </>
        )}
      </div>
    </div>
  );
}
