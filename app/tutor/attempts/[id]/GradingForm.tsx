"use client";

import { useState } from "react";
import { gradeAttempt } from "@/lib/actions";

type PerQ = { score: string; maxScore: string };

export default function GradingForm({
  attemptId,
  questionKeys,
  hasGrade,
  existingComment,
  existingPerQuestion,
}: {
  attemptId: string;
  questionKeys: string[];
  hasGrade: boolean;
  existingComment: string | null;
  existingPerQuestion: Record<string, { score: number | null; maxScore: number | null }>;
}) {
  const [perQ, setPerQ] = useState<Record<string, PerQ>>(
    Object.fromEntries(
      questionKeys.map((k) => [k, {
        score: existingPerQuestion[k]?.score?.toString() ?? "",
        maxScore: existingPerQuestion[k]?.maxScore?.toString() ?? "",
      }])
    )
  );

  const totalScore = questionKeys.reduce((sum, k) => sum + (parseFloat(perQ[k]?.score) || 0), 0);
  const totalMax = questionKeys.reduce((sum, k) => sum + (parseFloat(perQ[k]?.maxScore) || 0), 0);

  function update(key: string, field: "score" | "maxScore", val: string) {
    setPerQ((prev) => ({ ...prev, [key]: { ...prev[key], [field]: val } }));
  }

  return (
    <form action={gradeAttempt} className="flex flex-col gap-3">
      <input type="hidden" name="attemptId" value={attemptId} />
      <input type="hidden" name="score" value={totalScore} />
      <input type="hidden" name="maxScore" value={totalMax} />
      <input type="hidden" name="perQuestionJson" value={JSON.stringify(
        Object.fromEntries(questionKeys.map((k) => [k, {
          score: parseFloat(perQ[k]?.score) || 0,
          maxScore: parseFloat(perQ[k]?.maxScore) || 0,
        }]))
      )} />

      <div className="flex flex-col gap-2">
        {questionKeys.map((key) => (
          <div key={key} className="flex items-center gap-3 rounded border px-3 py-2">
            <span className="w-10 shrink-0 text-sm font-medium text-gray-600">{key.toUpperCase()}</span>
            <input
              type="number" step="0.5" min="0" placeholder="Score"
              value={perQ[key]?.score ?? ""}
              onChange={(e) => update(key, "score", e.target.value)}
              className="w-20 rounded border px-2 py-1 text-sm"
            />
            <span className="text-gray-400">/</span>
            <input
              type="number" step="0.5" min="0" placeholder="Max"
              value={perQ[key]?.maxScore ?? ""}
              onChange={(e) => update(key, "maxScore", e.target.value)}
              className="w-20 rounded border px-2 py-1 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded bg-gray-50 px-3 py-2">
        <span className="text-sm font-medium text-gray-600">Total</span>
        <span className="text-lg font-semibold">{totalScore} / {totalMax}</span>
      </div>

      <textarea
        name="overallComment"
        placeholder="Overall feedback"
        defaultValue={existingComment ?? ""}
        rows={4}
        className="rounded border p-3"
      />
      <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">
        {hasGrade ? "Update Grade" : "Submit Grade"}
      </button>
    </form>
  );
}
