"use client";

import { useEffect, useRef, useState } from "react";
import type { Document as DocumentType, Page as PageType } from "react-pdf";

type ReactPdfModule = { Document: typeof DocumentType; Page: typeof PageType };
type Stroke = [number, number][];
type Pages = Record<string, Stroke[]>;

function PdfPane({
  blob,
  label,
  annotationPages,
  renderWidth,
}: {
  blob: string;
  label: string;
  annotationPages?: Pages;
  renderWidth: number;
}) {
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(renderWidth * 1.414);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !annotationPages) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const stroke of annotationPages[String(page)] ?? []) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (const [x, y] of stroke.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [page, annotationPages, canvasHeight]);

  // Re-render page at new width when renderWidth changes
  useEffect(() => {
    setCanvasHeight(renderWidth * 1.414);
  }, [renderWidth]);

  if (!reactPdf) return <p className="text-sm text-gray-400">Loading…</p>;
  const { Document, Page } = reactPdf;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="relative rounded border" style={{ width: renderWidth, height: canvasHeight }}>
        <Document file={blob} onLoadSuccess={({ numPages: n }) => setNumPages(n)}>
          <Page
            pageNumber={page}
            width={renderWidth}
            onLoadSuccess={(p) => setCanvasHeight(renderWidth * (p.height / p.width))}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        {annotationPages && (
          <canvas
            ref={canvasRef}
            width={renderWidth}
            height={canvasHeight}
            className="pointer-events-none absolute left-0 top-0"
          />
        )}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-gray-500">Page {page} / {numPages || "?"}</span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(numPages || p, p + 1))}
          disabled={page >= numPages}
          className="rounded border px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function AnnotatedPdfViewer({
  paperFileUrl,
  markSchemeFileUrl,
  annotationPages,
}: {
  paperFileUrl: string;
  markSchemeFileUrl: string;
  annotationPages: Pages;
}) {
  const [paperBlob, setPaperBlob] = useState<string | null>(null);
  const [markBlob, setMarkBlob] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sideBySide, setSideBySide] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let paperUrl: string, markUrl: string;
    Promise.all([
      fetch(paperFileUrl).then((r) => { if (!r.ok) throw new Error(`paper HTTP ${r.status}`); return r.blob(); }),
      fetch(markSchemeFileUrl).then((r) => { if (!r.ok) throw new Error(`mark scheme HTTP ${r.status}`); return r.blob(); }),
    ]).then(([pb, mb]) => {
      paperUrl = URL.createObjectURL(pb);
      markUrl = URL.createObjectURL(mb);
      setPaperBlob(paperUrl);
      setMarkBlob(markUrl);
    }).catch((err: unknown) => setLoadError(String(err)));
    return () => {
      if (paperUrl) URL.revokeObjectURL(paperUrl);
      if (markUrl) URL.revokeObjectURL(markUrl);
    };
  }, [paperFileUrl, markSchemeFileUrl]);

  const GAP = 16;
  const renderWidth = sideBySide
    ? Math.floor((containerWidth - GAP) / 2)
    : containerWidth;

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>;

  return (
    <div className="mb-6" ref={containerRef}>
      <div className="mb-3">
        <button
          type="button"
          onClick={() => setSideBySide((s) => !s)}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {sideBySide ? "Single view" : "Side by side with mark scheme"}
        </button>
      </div>

      {!paperBlob || !markBlob ? (
        <p className="text-sm text-gray-400">Loading PDFs…</p>
      ) : (
        <div className="flex gap-4">
          <PdfPane
            blob={paperBlob}
            label="Student's annotated paper"
            annotationPages={annotationPages}
            renderWidth={renderWidth}
          />
          {sideBySide && (
            <PdfPane
              blob={markBlob}
              label="Mark scheme"
              renderWidth={renderWidth}
            />
          )}
        </div>
      )}
    </div>
  );
}
