"use client";

import { useEffect, useRef, useState } from "react";
import type { Document as DocumentType, Page as PageType } from "react-pdf";
import { saveTutorAnnotation } from "@/lib/actions";

type ReactPdfModule = { Document: typeof DocumentType; Page: typeof PageType };
type Stroke = [number, number][];
type Pages = Record<string, Stroke[]>;

const NAV_BTN = "rounded bg-slate-200 px-2 py-1 text-slate-700 hover:bg-slate-300 disabled:opacity-40 text-sm";

function drawAnnotations(
  ctx: CanvasRenderingContext2D,
  strokes: Stroke[],
  highlights: Stroke[],
) {
  // Highlights below strokes: thick, amber, semi-transparent
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
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (const [x, y] of stroke.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  // Strokes on top: thin, red, opaque
  if (strokes.length) {
    ctx.strokeStyle = "#dc2626";
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
  }
}

function drawStudentStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
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
}

function AnnotatablePdfPane({
  blob, label, studentPages, tutorPages, tutorHighlights, onTutorChange, renderWidth,
}: {
  blob: string;
  label: string;
  studentPages?: Pages;
  tutorPages: Pages;
  tutorHighlights: Pages;
  onTutorChange: (strokes: Pages, highlights: Pages) => void;
  renderWidth: number;
}) {
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(renderWidth * 1.414);
  const [mode, setMode] = useState<"draw" | "highlight">("draw");
  const studentCanvasRef = useRef<HTMLCanvasElement>(null);
  const tutorCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const currentStroke = useRef<Stroke>([]);

  useEffect(() => {
    let cancelled = false;
    import("react-pdf").then(({ Document, Page, pdfjs }) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdf({ Document, Page });
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { setCanvasHeight(renderWidth * 1.414); }, [renderWidth]);

  useEffect(() => {
    const ctx = studentCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawStudentStrokes(ctx, studentPages?.[String(page)] ?? []);
  }, [page, studentPages, canvasHeight]);

  useEffect(() => {
    const ctx = tutorCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawAnnotations(ctx, tutorPages[String(page)] ?? [], tutorHighlights[String(page)] ?? []);
  }, [page, tutorPages, tutorHighlights, canvasHeight]);

  function point(e: React.PointerEvent<HTMLCanvasElement>): [number, number] {
    const rect = tutorCanvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    currentStroke.current = [point(e)];
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    currentStroke.current.push(point(e));
    const ctx = tutorCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawAnnotations(ctx, tutorPages[String(page)] ?? [], tutorHighlights[String(page)] ?? []);
    // Preview current stroke
    if (currentStroke.current.length >= 2) {
      if (mode === "highlight") {
        ctx.save();
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 16;
      } else {
        ctx.strokeStyle = "#dc2626";
        ctx.lineWidth = 2;
      }
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(currentStroke.current[0][0], currentStroke.current[0][1]);
      for (const [x, y] of currentStroke.current.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
      if (mode === "highlight") ctx.restore();
    }
  }

  function onPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    if (currentStroke.current.length > 1) {
      if (mode === "draw") {
        const next = { ...tutorPages, [String(page)]: [...(tutorPages[String(page)] ?? []), currentStroke.current] };
        onTutorChange(next, tutorHighlights);
      } else {
        const next = { ...tutorHighlights, [String(page)]: [...(tutorHighlights[String(page)] ?? []), currentStroke.current] };
        onTutorChange(tutorPages, next);
      }
    }
    currentStroke.current = [];
  }

  function undo() {
    if (mode === "draw") {
      const strokes = tutorPages[String(page)] ?? [];
      onTutorChange({ ...tutorPages, [String(page)]: strokes.slice(0, -1) }, tutorHighlights);
    } else {
      const highlights = tutorHighlights[String(page)] ?? [];
      onTutorChange(tutorPages, { ...tutorHighlights, [String(page)]: highlights.slice(0, -1) });
    }
  }

  function clearMyPage() {
    onTutorChange({ ...tutorPages, [String(page)]: [] }, { ...tutorHighlights, [String(page)]: [] });
  }

  if (!reactPdf) return <p className="text-sm text-gray-400">Loading…</p>;
  const { Document, Page } = reactPdf;
  const hasMarks = (tutorPages[String(page)] ?? []).length + (tutorHighlights[String(page)] ?? []).length > 0;

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
        <canvas ref={studentCanvasRef} width={renderWidth} height={canvasHeight}
          className="pointer-events-none absolute left-0 top-0" />
        <canvas ref={tutorCanvasRef} width={renderWidth} height={canvasHeight}
          className={`absolute left-0 top-0 touch-none ${mode === "highlight" ? "cursor-cell" : "cursor-crosshair"}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
          className={NAV_BTN}>Prev</button>
        <span className="text-sm text-gray-500">Page {page} / {numPages || "?"}</span>
        <button type="button" onClick={() => setPage((p) => Math.min(numPages || p, p + 1))} disabled={page >= numPages}
          className={NAV_BTN}>Next</button>
        <button type="button" onClick={() => setMode(mode === "draw" ? "highlight" : "draw")}
          className={`rounded px-2 py-1 text-sm ${mode === "highlight" ? "bg-amber-400 text-white" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}>
          Highlight
        </button>
        <button type="button" onClick={undo} disabled={!hasMarks}
          className={NAV_BTN}>Undo</button>
        <button type="button" onClick={clearMyPage} disabled={!hasMarks}
          className={NAV_BTN}>Clear My Marks</button>
        <span className="text-xs text-red-600">&#9679; Marks</span>
        <span className="text-xs text-amber-500">&#9679; Highlights</span>
        <span className="text-xs text-blue-600">&#9679; Student</span>
      </div>
    </div>
  );
}

function ReadOnlyPdfPane({ blob, label, renderWidth }: { blob: string; label: string; renderWidth: number }) {
  const [reactPdf, setReactPdf] = useState<ReactPdfModule | null>(null);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    import("react-pdf").then(({ Document, Page, pdfjs }) => {
      if (cancelled) return;
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
      setReactPdf({ Document, Page });
    });
    return () => { cancelled = true; };
  }, []);

  if (!reactPdf) return <p className="text-sm text-gray-400">Loading…</p>;
  const { Document, Page } = reactPdf;

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <div className="rounded border" style={{ width: renderWidth }}>
        <Document file={blob} onLoadSuccess={({ numPages: n }) => setNumPages(n)}>
          <Page pageNumber={page} width={renderWidth} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
          className={NAV_BTN}>Prev</button>
        <span className="text-sm text-gray-500">Page {page} / {numPages || "?"}</span>
        <button type="button" onClick={() => setPage((p) => Math.min(numPages || p, p + 1))} disabled={page >= numPages}
          className={NAV_BTN}>Next</button>
      </div>
    </div>
  );
}

export default function AnnotatedPdfViewer({
  attemptId,
  paperFileUrl,
  markSchemeFileUrl,
  scanFileUrls,
  studentAnnotationPages,
  initialTutorAnnotationPages,
  initialTutorHighlightPages,
  initialScanAnnotationPages,
  initialScanHighlightPages,
}: {
  attemptId: string;
  paperFileUrl: string;
  markSchemeFileUrl: string;
  scanFileUrls: { key: string; url: string }[];
  studentAnnotationPages: Pages;
  initialTutorAnnotationPages: Pages;
  initialTutorHighlightPages: Pages;
  initialScanAnnotationPages: Record<string, Pages>;
  initialScanHighlightPages: Record<string, Pages>;
}) {
  const [paperBlob, setPaperBlob] = useState<string | null>(null);
  const [markBlob, setMarkBlob] = useState<string | null>(null);
  const [scanBlobs, setScanBlobs] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sideBySide, setSideBySide] = useState(false);
  const [tutorPages, setTutorPages] = useState<Pages>(initialTutorAnnotationPages);
  const [tutorHighlights, setTutorHighlights] = useState<Pages>(initialTutorHighlightPages);
  const [scanAnnotations, setScanAnnotations] = useState<Record<string, Pages>>(initialScanAnnotationPages);
  const [scanHighlights, setScanHighlights] = useState<Record<string, Pages>>(initialScanHighlightPages);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
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

  useEffect(() => {
    if (!scanFileUrls.length) return;
    const urls: string[] = [];
    Promise.all(
      scanFileUrls.map(({ key, url }) =>
        fetch(url)
          .then((r) => { if (!r.ok) throw new Error(`scan HTTP ${r.status}`); return r.blob(); })
          .then((blob) => ({ key, objectUrl: URL.createObjectURL(blob) }))
      )
    ).then((results) => {
      const map: Record<string, string> = {};
      for (const { key, objectUrl } of results) { map[key] = objectUrl; urls.push(objectUrl); }
      setScanBlobs(map);
    }).catch((err: unknown) => setLoadError(String(err)));
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [scanFileUrls]);

  function triggerSave(
    pages: Pages, highlights: Pages,
    scans: Record<string, Pages>, scanHls: Record<string, Pages>,
  ) {
    setSaveStatus("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveTutorAnnotation(attemptId, pages, highlights, scans, scanHls, renderWidth);
      setSaveStatus("saved");
    }, 800);
  }

  function handleTutorChange(strokes: Pages, highlights: Pages) {
    setTutorPages(strokes);
    setTutorHighlights(highlights);
    triggerSave(strokes, highlights, scanAnnotations, scanHighlights);
  }

  function handleScanChange(scanKey: string, strokes: Pages, highlights: Pages) {
    const nextScans = { ...scanAnnotations, [scanKey]: strokes };
    const nextHls = { ...scanHighlights, [scanKey]: highlights };
    setScanAnnotations(nextScans);
    setScanHighlights(nextHls);
    triggerSave(tutorPages, tutorHighlights, nextScans, nextHls);
  }

  const GAP = 16;
  const renderWidth = sideBySide ? Math.floor((containerWidth - GAP) / 2) : containerWidth;

  if (loadError) return <p className="text-sm text-red-600">{loadError}</p>;

  return (
    <div className="mb-6" ref={containerRef}>
      <div className="mb-3 flex items-center gap-3">
        <button type="button" onClick={() => setSideBySide((s) => !s)}
          className={`rounded px-3 py-1.5 text-sm text-white hover:opacity-90 ${sideBySide ? "bg-foreground ring-2 ring-offset-1 ring-foreground" : "bg-foreground"}`}>
          Mark Scheme
        </button>
        <span className="text-xs text-gray-400">
          {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved" : ""}
        </span>
      </div>
      {!paperBlob || !markBlob ? (
        <p className="text-sm text-gray-400">Loading PDFs…</p>
      ) : (
        <div className="flex gap-4">
          <AnnotatablePdfPane
            blob={paperBlob}
            label="Student's annotated paper"
            studentPages={studentAnnotationPages}
            tutorPages={tutorPages}
            tutorHighlights={tutorHighlights}
            onTutorChange={handleTutorChange}
            renderWidth={renderWidth}
          />
          {sideBySide && <ReadOnlyPdfPane blob={markBlob} label="Mark scheme" renderWidth={renderWidth} />}
        </div>
      )}
      {scanFileUrls.map(({ key }) => {
        const blob = scanBlobs[key];
        const filename = key.split("/").pop() ?? key;
        return blob ? (
          <div key={key} className="mt-6">
            <AnnotatablePdfPane
              blob={blob}
              label={`Student scan: ${filename}`}
              tutorPages={scanAnnotations[key] ?? {}}
              tutorHighlights={scanHighlights[key] ?? {}}
              onTutorChange={(strokes, highlights) => handleScanChange(key, strokes, highlights)}
              renderWidth={renderWidth}
            />
          </div>
        ) : (
          <p key={key} className="mt-4 text-sm text-gray-400">Loading scan…</p>
        );
      })}
    </div>
  );
}
