"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startTermExamAction, submitTermExamAction } from "@/app/student/actions";
import type { TermExamForStudent, TermExamGrade } from "@/lib/ai/term-exam";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function TermExam({
  courseId,
  exam,
  priorResult,
}: {
  courseId: string;
  exam: TermExamForStudent | null;
  priorResult: { score: number; passed: boolean } | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<TermExamGrade | null>(null);
  const [remaining, setRemaining] = useState(exam?.durationSeconds ?? 0);
  const submittedRef = useRef(false);

  const submit = useCallback(() => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    startTransition(async () => {
      setError(null);
      try {
        setGrade(await submitTermExamAction(courseId, answers));
      } catch (e) {
        submittedRef.current = false;
        setError(e instanceof Error ? e.message : "grading failed");
      }
    });
  }, [courseId, answers]);

  useEffect(() => {
    if (!started || grade) return;
    if (remaining <= 0) {
      submit();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [started, remaining, grade, submit]);

  if (!exam) {
    return (
      <Card className="space-y-3 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">Term exam</h2>
        <p className="text-sm text-ink-3">
          {priorResult
            ? `You've taken this term exam - ${Math.round(priorResult.score * 100)}%.`
            : "A timed, cumulative exam across the whole course, with no help mid-exam."}
        </p>
        <Button
          variant="accent"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await startTermExamAction(courseId);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "could not prepare the exam");
              }
            })
          }
        >
          {pending ? "Preparing..." : priorResult ? "Retake term exam" : "Prepare term exam"}
        </Button>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </Card>
    );
  }

  if (!started && !grade) {
    return (
      <Card tone="muted" className="space-y-3 p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          {exam.termLabel} - ready when you are
        </h2>
        <p className="text-sm text-ink-2">
          {exam.questions.length} questions &middot; {Math.round(exam.durationSeconds / 60)}{" "}
          minutes. The timer starts when you begin and submits automatically at zero.
        </p>
        <p className="text-xs text-ink-4">Covers: {exam.coversTitles.join(", ")}.</p>
        <Button variant="accent" onClick={() => setStarted(true)}>
          Start the exam
        </Button>
      </Card>
    );
  }

  const low = remaining <= 60;

  return (
    <Card className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          {exam.termLabel}
        </h2>
        {!grade ? (
          <span
            className={`rounded-full px-3 py-1 font-mono text-sm font-semibold ${
              low ? "bg-danger-soft text-danger" : "bg-surface-2 text-ink-2"
            }`}
          >
            {fmt(Math.max(0, remaining))}
          </span>
        ) : null}
      </div>

      <ol className="space-y-5">
        {exam.questions.map((q, i) => {
          const g = grade?.perQuestion.find((x) => x.id === q.id);
          return (
            <li key={q.id} className="space-y-2">
              <p className="text-sm font-medium text-ink">
                {i + 1}. {q.prompt}
              </p>
              {q.type === "mcq" ? (
                <div className="space-y-1.5">
                  {q.options.map((opt, idx) => {
                    const selected = answers[q.id] === String(idx);
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
                          name={q.id}
                          value={String(idx)}
                          className="accent-[color:var(--terracotta)]"
                          checked={selected}
                          disabled={pending || grade !== null}
                          onChange={(e) =>
                            setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
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
                  value={answers[q.id] ?? ""}
                  disabled={pending || grade !== null}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Your answer"
                  className="w-full max-w-xs rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
                />
              )}
              {g ? (
                <p className={`text-xs ${g.correct ? "text-success" : "text-danger"}`}>
                  {g.correct ? "Correct." : `Answer: ${g.correctAnswer}.`}{" "}
                  <span className="text-ink-4">{g.explanation}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {!grade ? (
        <Button variant="accent" disabled={pending} onClick={submit}>
          {pending ? "Submitting..." : "Submit exam"}
        </Button>
      ) : (
        <div
          className={`rounded-[var(--radius)] border p-4 text-sm ${
            grade.passed
              ? "border-success/40 bg-success-soft"
              : "border-warning/40 bg-warning-soft"
          }`}
        >
          <p className="font-display text-base font-semibold text-ink">
            {grade.correctCount}/{grade.total} &middot; {Math.round(grade.score * 100)}%
          </p>
          <p className="mt-1 text-ink-2">
            Recorded for {exam.termLabel}. This result feeds the compliance report.
          </p>
        </div>
      )}
    </Card>
  );
}
