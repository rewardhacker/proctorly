"use client";

import { useState } from "react";
import { gradeAttempt } from "@/lib/actions";
import type { JSONContent } from "@tiptap/react";
import AnswerView from "@/components/AnswerView";

type PerQ = { score: string; maxScore: string };

export default function GradingForm({
  attemptId,
  questionKeys,
  questionAnswers,
  hasGrade,
  existingComment,
  existingPerQuestion,
}: {
  attemptId: string;
  questionKeys: string[];
  questionAnswers: { key: string; content: JSONContent | null; flagged: boolean }[];
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

      <div className="flex flex-col gap-4">
        {questionKeys.map((key) => {
          const qa = questionAnswers.find((q) => q.key === key);
          return (
            <div key={key} className="flex gap-4 rounded border p-3">
              {/* student answer */}
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-xs font-medium text-gray-500">
                  {key.toUpperCase()} {qa?.flagged && "(flagged by student)"}
                </p>
                <AnswerView content={qa?.content ?? null} />
              </div>
              {/* mark allocation */}
              <div className="flex shrink-0 flex-col items-center gap-2 border-l pl-4">
                <span className="text-xs font-medium text-gray-500">Marks</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number" step="0.5" min="0" placeholder="Score"
                    value={perQ[key]?.score ?? ""}
                    onChange={(e) => update(key, "score", e.target.value)}
                    className="w-16 rounded border px-2 py-1 text-sm"
                  />
                  <span className="text-gray-400">/</span>
                  <input
                    type="number" step="0.5" min="0" placeholder="Max"
                    value={perQ[key]?.maxScore ?? ""}
                    onChange={(e) => update(key, "maxScore", e.target.value)}
                    className="w-16 rounded border px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          );
        })}
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
