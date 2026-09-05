"use client";

import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startTermExamAction, submitTermExamAction } from "@/app/student/actions";
import type { TermExamForStudent, TermExamGrade } from "@/lib/ai/term-exam";

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
        const g = await submitTermExamAction(courseId, answers);
        setGrade(g);
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
      <section className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Term exam</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {priorResult
            ? `You've taken this term exam — ${Math.round(priorResult.score * 100)}%.`
            : "A timed, cumulative exam across the whole course. No help mid-exam."}
        </p>
        <button
          type="button"
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
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {pending ? "Preparing…" : priorResult ? "Retake term exam" : "Prepare term exam"}
        </button>
        {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </section>
    );
  }

  if (!started && !grade) {
    return (
      <section className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Term exam · {exam.termLabel}
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {exam.questions.length} questions · {Math.round(exam.durationSeconds / 60)} minutes ·
          the timer starts when you begin and auto-submits at zero. Covers:{" "}
          {exam.coversTitles.join(", ")}.
        </p>
        <button
          type="button"
          onClick={() => setStarted(true)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
        >
          Start the exam
        </button>
      </section>
    );
  }

  const low = remaining <= 60;

  return (
    <section className="space-y-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Term exam · {exam.termLabel}
        </h2>
        {!grade ? (
          <span
            className={`rounded-md px-2 py-0.5 text-sm font-mono font-medium ${
              low
                ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {fmt(Math.max(0, remaining))}
          </span>
        ) : null}
      </div>

      <ol className="space-y-4">
        {exam.questions.map((q, i) => {
          const g = grade?.perQuestion.find((x) => x.id === q.id);
          return (
            <li key={q.id} className="space-y-2">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {i + 1}. {q.prompt}
              </p>
              {q.type === "mcq" ? (
                <div className="space-y-1">
                  {q.options.map((opt, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={q.id}
                        value={String(idx)}
                        checked={answers[q.id] === String(idx)}
                        disabled={pending || grade !== null}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      />
                      <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[q.id] ?? ""}
                  disabled={pending || grade !== null}
                  onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                  placeholder="Your answer"
                  className="w-full max-w-xs rounded-md border border-black/15 bg-white px-2 py-1 text-sm dark:border-white/20 dark:bg-zinc-900"
                />
              )}
              {g ? (
                <p
                  className={`text-xs ${
                    g.correct
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {g.correct ? "Correct." : `Answer: ${g.correctAnswer}.`}{" "}
                  <span className="text-zinc-500 dark:text-zinc-400">{g.explanation}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      {!grade ? (
        <button
          type="button"
          disabled={pending}
          onClick={submit}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
        >
          {pending ? "Submitting…" : "Submit exam"}
        </button>
      ) : (
        <div
          className={`rounded-lg border p-3 text-sm ${
            grade.passed
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700/60 dark:bg-emerald-950/40"
              : "border-amber-300 bg-amber-50 dark:border-amber-700/60 dark:bg-amber-950/40"
          }`}
        >
          <p className="font-semibold">
            {grade.correctCount}/{grade.total} · {Math.round(grade.score * 100)}%
          </p>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            Recorded for {exam.termLabel}. This result feeds the compliance report.
          </p>
        </div>
      )}
    </section>
  );
}
