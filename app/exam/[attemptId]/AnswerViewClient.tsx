"use client";

import dynamic from "next/dynamic";

const AnswerView = dynamic(() => import("@/components/AnswerView"), { ssr: false });

export default AnswerView;
