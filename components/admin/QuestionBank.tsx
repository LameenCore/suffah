"use client";

import { useState, useTransition } from "react";
import type { QuestionBankCourse } from "@/lib/db/question-bank-queries";
import type { ItemFlag } from "@/lib/analytics/item-analytics";
import { setQuestionDisabledAction } from "@/app/admin/question-bank/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

const FLAG_LABEL: Record<ItemFlag, string> = {
  ok: "",
  insufficient_data: "not enough attempts",
  too_hard: "very hard - check the key",
  too_easy: "everyone gets this",
  negative_discrimination: "miskeyed? strong students miss it",
  weak_discrimination: "weak - doesn't separate students",
};
const FLAG_TONE: Partial<Record<ItemFlag, "warning" | "danger" | "mustard">> = {
  too_hard: "warning",
  too_easy: "mustard",
  negative_discrimination: "danger",
  weak_discrimination: "warning",
};

export function QuestionBank({ courses }: { courses: QuestionBankCourse[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(
    kind: "checkpoint",
    sourceId: string,
    questionId: string,
    disabled: boolean,
  ) {
    setError(null);
    start(async () => {
      const res = await setQuestionDisabledAction(kind, sourceId, questionId, disabled, "");
      if (!res.ok) setError(res.error ?? "failed");
    });
  }

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {courses.map((c) => (
        <Card key={c.courseId} as="section" className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">{c.courseName}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border-strong text-left text-xs uppercase tracking-wide text-ink-4">
                  <th className="py-2 pr-3">Question</th>
                  <th className="py-2 pr-3">p-value</th>
                  <th className="py-2 pr-3">discrimination</th>
                  <th className="py-2 pr-3">flag</th>
                  <th className="py-2">state</th>
                </tr>
              </thead>
              <tbody>
                {c.questions.map((q) => (
                  <tr
                    key={`${q.sourceId}:${q.questionId}`}
                    className={`border-b border-border align-top ${q.disabled ? "opacity-50" : ""}`}
                  >
                    <td className="py-2 pr-3">
                      <p className="text-ink">{q.prompt}</p>
                      <p className="mt-0.5 text-xs text-ink-4">
                        {q.sourceTitle} · {q.type} · answer: {q.answer}
                      </p>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {q.stats?.pValue != null ? q.stats.pValue.toFixed(2) : "-"}
                      {q.stats ? (
                        <span className="ml-1 text-xs text-ink-4">n={q.stats.n}</span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {q.stats?.discrimination != null ? q.stats.discrimination.toFixed(2) : "-"}
                    </td>
                    <td className="py-2 pr-3">
                      {q.stats && q.stats.flag !== "ok" ? (
                        <Badge tone={FLAG_TONE[q.stats.flag] ?? "mustard"}>
                          {FLAG_LABEL[q.stats.flag]}
                        </Badge>
                      ) : (
                        <span className="text-xs text-ink-4">-</span>
                      )}
                    </td>
                    <td className="py-2">
                      <Button
                        size="sm"
                        variant={q.disabled ? "primary" : "ghost"}
                        disabled={pending}
                        onClick={() =>
                          toggle("checkpoint", q.sourceId, q.questionId, !q.disabled)
                        }
                      >
                        {q.disabled ? "Enable" : "Disable"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
