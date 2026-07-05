"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { Document as DocumentType, Page as PageType } from "react-pdf";

const RENDER_WIDTH = 560;

type ReactPdfModule = { Document: typeof DocumentType; Page: typeof PageType };
type Stroke = [number, number][];
type Pages = Record<string, Stroke[]>;

function PdfPane({
  blob,
  label,
  annotationPages,
  page,
  numPages,
  onNumPages,
}: {
  blob: string;
  label: string;
  annotationPages?: Pages;
  page: number;
  numPages: number;
  onNumPages: (n: number) => void;
}) {
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [canvasHeight, setCanvasHeight] = useState(RENDER_WIDTH * 1.414);
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

  if (!reactPdf) return <p className="text-sm text-gray-400">Loading…</p>;
  const { Document, Page } = reactPdf;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <div className="relative rounded border" style={{ width: RENDER_WIDTH, height: canvasHeight }}>
        <Document file={blob} onLoadSuccess={({ numPages: n }) => onNumPages(n)}>
          <Page
            pageNumber={page}
            width={RENDER_WIDTH}
            onLoadSuccess={(p) => setCanvasHeight(RENDER_WIDTH * (p.height / p.width))}
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        </Document>
        {annotationPages && (
          <canvas
            ref={canvasRef}
            width={RENDER_WIDTH}
            height={canvasHeight}
            className="pointer-events-none absolute left-0 top-0"
          />
        )}
      </div>
      <p className="text-xs text-gray-400">Page {page} / {numPages || "?"}</p>
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
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [markNumPages, setMarkNumPages] = useState(0);

  useEffect(() => {
    let paperUrl: string, markUrl: string;
    Promise.all([
      fetch(paperFileUrl).then(r => { if (!r.ok) throw new Error(`paper HTTP ${r.status}`); return r.blob(); }),
      fetch(markSchemeFileUrl).then(r => { if (!r.ok) throw new Error(`mark scheme HTTP ${r.status}`); return r.blob(); }),
    ]).then(([paperBlob, markBlob]) => {
      paperUrl = URL.createObjectURL(paperBlob);
      markUrl = URL.createObjectURL(markBlob);
      setPaperBlob(paperUrl);
      setMarkBlob(markUrl);
    }).catch((err: unknown) => setLoadError(String(err)));
    return () => {
      if (paperUrl) URL.revokeObjectURL(paperUrl);
      if (markUrl) URL.revokeObjectURL(markUrl);
    };
  }, [paperFileUrl, markSchemeFileUrl]);

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>;
  if (!paperBlob || !markBlob) return <p className="text-sm text-gray-400">Loading PDFs…</p>;

  const maxPages = Math.max(numPages, markNumPages);

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setSideBySide((s) => !s)}
          className="rounded border px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {sideBySide ? "Single view" : "Side by side with mark scheme"}
        </button>
        <div className="flex items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border px-2 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span className="text-gray-500">Page {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(maxPages || p, p + 1))}
            disabled={page >= maxPages}
            className="rounded border px-2 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <div className={`flex gap-4 ${sideBySide ? "overflow-x-auto" : ""}`}>
        <PdfPane
          blob={paperBlob}
          label="Student's annotated paper"
          annotationPages={annotationPages}
          page={page}
          numPages={numPages}
          onNumPages={setNumPages}
        />
        {sideBySide && (
          <PdfPane
            blob={markBlob}
            label="Mark scheme"
            page={page}
            numPages={markNumPages}
            onNumPages={setMarkNumPages}
          />
        )}
      </div>
    </div>
  );
}
