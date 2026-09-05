"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startCheckpointAction, submitCheckpointAction } from "@/app/student/actions";
import type { CheckpointForStudent, CheckpointGrade } from "@/lib/ai/checkpoint";

export function Checkpoint({
  nodeId,
  checkpoint,
  priorPassed,
  isLastNode,
}: {
  nodeId: string;
  /** null until the checkpoint has been generated for this node. */
  checkpoint: CheckpointForStudent | null;
  priorPassed: boolean;
  isLastNode: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<CheckpointGrade | null>(null);
  const [error, setError] = useState<string | null>(null);

  const heading = (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Checkpoint</h2>
  );

  if (priorPassed && !grade) {
    return (
      <section className="space-y-2 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700/60 dark:bg-emerald-950/40">
        {heading}
        <p className="text-sm text-emerald-900 dark:text-emerald-200">
          You&apos;ve passed this checkpoint.
          {isLastNode ? " That's the last node in this course." : ""}
        </p>
      </section>
    );
  }

  if (!checkpoint) {
    return (
      <section className="space-y-3 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
        {heading}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          A few quick questions on this lesson. You need 70% to move on.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await startCheckpointAction(nodeId);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : "could not start checkpoint");
              }
            })
          }
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
        >
          {pending ? "Preparing…" : "Start checkpoint"}
        </button>
        {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
      </section>
    );
  }

  const gradeById = new Map(grade?.perQuestion.map((g) => [g.id, g]) ?? []);
  const allAnswered = checkpoint.questions.every((q) => (answers[q.id] ?? "") !== "");

  function submit() {
    startTransition(async () => {
      setError(null);
      try {
        const result = await submitCheckpointAction(nodeId, answers);
        setGrade(result);
      } catch (e) {
        setError(e instanceof Error ? e.message : "grading failed");
      }
    });
  }

  return (
    <section className="space-y-4 rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
      {heading}

      <ol className="space-y-4">
        {checkpoint.questions.map((q, i) => {
          const g = gradeById.get(q.id);
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
                        onChange={(e) =>
                          setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                        }
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
                  {g.correct ? "Correct." : `Not quite — answer: ${g.correctAnswer}.`}{" "}
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
          disabled={pending || !allAnswered}
          onClick={submit}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
        >
          {pending ? "Grading…" : "Submit checkpoint"}
        </button>
      ) : grade.passed ? (
        <div className="space-y-2 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm dark:border-emerald-700/60 dark:bg-emerald-950/40">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            Passed — {grade.correctCount}/{grade.total} ({Math.round(grade.score * 100)}%).
          </p>
          <p className="text-emerald-800 dark:text-emerald-300">
            {grade.advancedToNodeId
              ? "Your pod advanced to the next lesson."
              : "That's the last node in this course."}
          </p>
          {grade.advancedToNodeId ? (
            <button
              type="button"
              onClick={() => router.refresh()}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
            >
              Go to next lesson
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-700/60 dark:bg-amber-950/40">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Score {grade.correctCount}/{grade.total} ({Math.round(grade.score * 100)}%) — you
            need 70%.
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Review the lesson above, then try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setGrade(null);
              setAnswers({});
            }}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
