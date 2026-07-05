"use client";

import dynamic from "next/dynamic";

const AnnotatedPdfViewer = dynamic(() => import("./AnnotatedPdfViewer"), { ssr: false });

export default AnnotatedPdfViewer;
