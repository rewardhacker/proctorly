"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type AnnotatedPdfViewer from "./AnnotatedPdfViewer";

const AnnotatedPdfViewerDynamic = dynamic(() => import("./AnnotatedPdfViewer"), { ssr: false });

export default function AnnotatedPdfViewerClient(props: ComponentProps<typeof AnnotatedPdfViewer>) {
  return <AnnotatedPdfViewerDynamic {...props} />;
}
