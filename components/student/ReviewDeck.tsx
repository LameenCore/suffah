"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitReviewAction } from "@/app/student/actions";
import type { ReviewCard, ReviewResult } from "@/lib/review";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ReviewDeck({ cards }: { cards: ReviewCard[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byItem = new Map((result?.perItem ?? []).map((p) => [p.itemId, p]));
  const allAnswered = cards.every((c) => (answers[c.itemId] ?? "") !== "");

  function submit() {
    setError(null);
    start(async () => {
      try {
        setResult(await submitReviewAction(answers));
      } catch (e) {
        setError(e instanceof Error ? e.message : "could not save the review");
      }
    });
  }

  return (
    <Card className="space-y-5 p-5">
      <p className="text-sm text-ink-3">
        A few questions from lessons you&apos;ve already passed. Getting one right pushes it
        further out; a miss brings it back sooner. Nothing here changes your progress.
      </p>

      <ol className="space-y-5">
        {cards.map((c, i) => {
          const q = c.question;
          const fb = byItem.get(c.itemId);
          return (
            <li key={c.itemId} className="space-y-2">
              <p className="text-xs text-ink-4">
                {c.courseName} · {c.nodeTitle}
              </p>
              <p className="text-sm font-medium text-ink">
                {i + 1}. {q.prompt}
              </p>

              {q.type === "mcq" ? (
                <div className="space-y-1.5">
                  {q.options.map((opt, idx) => {
                    const selected = answers[c.itemId] === String(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex cursor-pointer items-center gap-2.5 rounded-[var(--radius)] border px-3 py-2 text-sm transition-colors ${
                          selected
                            ? "border-terracotta bg-terracotta-soft"
                            : "border-border bg-surface hover:border-border-strong"
                        }`}
                      >
                        <input
                          type="radio"
                          name={c.itemId}
                          value={String(idx)}
                          className="accent-[color:var(--terracotta)]"
                          checked={selected}
                          disabled={pending || result !== null}
                          onChange={(e) =>
                            setAnswers((a) => ({ ...a, [c.itemId]: e.target.value }))
                          }
                        />
                        <span className="text-ink-2">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[c.itemId] ?? ""}
                  disabled={pending || result !== null}
                  onChange={(e) => setAnswers((a) => ({ ...a, [c.itemId]: e.target.value }))}
                  placeholder="Your answer"
                  className="w-full max-w-xs rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
                />
              )}

              {fb ? (
                <p className={`text-xs ${fb.correct ? "text-success" : "text-danger"}`}>
                  {fb.correct ? "Still got it." : `Answer: ${fb.correctAnswer}.`}{" "}
                  <span className="text-ink-4">{fb.explanation}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {!result ? (
        <Button disabled={pending || !allAnswered} onClick={submit}>
          {pending ? "Checking..." : "Check my answers"}
        </Button>
      ) : (
        <div className="space-y-2 rounded-[var(--radius)] border border-teal/40 bg-teal-soft/60 p-4 text-sm">
          <p className="font-display text-base font-semibold text-teal-strong">
            {result.correct} of {result.reviewed} still fresh
          </p>
          <p className="text-ink-2">
            Rescheduled. Come back tomorrow for the next few.
          </p>
          <Button size="sm" variant="primary" onClick={() => router.refresh()}>
            Done
          </Button>
        </div>
      )}
    </Card>
  );
}
