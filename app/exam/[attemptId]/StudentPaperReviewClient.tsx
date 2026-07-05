"use client";

import dynamic from "next/dynamic";

const StudentPaperReview = dynamic(() => import("./StudentPaperReview"), { ssr: false });

export default StudentPaperReview;
