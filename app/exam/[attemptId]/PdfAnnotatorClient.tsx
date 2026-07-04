"use client";

import dynamic from "next/dynamic";

// pdfjs-dist executes browser-only code at module init time and breaks
// under Next's server-side render of client components, so it must never
// even be imported on the server.
const PdfAnnotator = dynamic(() => import("./PdfAnnotator"), { ssr: false });

export default PdfAnnotator;
