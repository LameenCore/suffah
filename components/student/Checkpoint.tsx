"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startCheckpointAction, submitCheckpointAction } from "@/app/student/actions";
import type { CheckpointForStudent, CheckpointGrade } from "@/lib/ai/checkpoint";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Crescent } from "@/components/ui/Motif";

const HEADING = (
  <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
    <Crescent className="h-4 w-4 text-terracotta" /> Checkpoint
  </h2>
);

export function Checkpoint({
  nodeId,
  checkpoint,
  priorPassed,
  isLastNode,
}: {
  nodeId: string;
  checkpoint: CheckpointForStudent | null;
  priorPassed: boolean;
  isLastNode: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<CheckpointGrade | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (priorPassed && !grade) {
    return (
      <Card tone="success" className="space-y-2 p-5">
        {HEADING}
        <p className="text-sm text-success">
          You&apos;ve passed this checkpoint.
          {isLastNode ? " That's the final step in this course." : ""}
        </p>
      </Card>
    );
  }

  if (!checkpoint) {
    return (
      <Card className="space-y-3 p-5">
        {HEADING}
        <p className="text-sm text-ink-3">
          A few quick questions on this lesson. You need 70% to move on &mdash; and you can
          try again as many times as you need.
        </p>
        <Button
          variant="accent"
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
        >
          {pending ? "Preparing..." : "Start checkpoint"}
        </Button>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </Card>
    );
  }

  const gradeById = new Map(grade?.perQuestion.map((g) => [g.id, g]) ?? []);
  const allAnswered = checkpoint.questions.every((q) => (answers[q.id] ?? "") !== "");

  function submit() {
    startTransition(async () => {
      setError(null);
      try {
        setGrade(await submitCheckpointAction(nodeId, answers));
      } catch (e) {
        setError(e instanceof Error ? e.message : "grading failed");
      }
    });
  }

  return (
    <Card className="space-y-5 p-5">
      {HEADING}

      <ol className="space-y-5">
        {checkpoint.questions.map((q, i) => {
          const g = gradeById.get(q.id);
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
                  {g.correct ? "Correct." : `Not quite - answer: ${g.correctAnswer}.`}{" "}
                  <span className="text-ink-4">{g.explanation}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {!grade ? (
        <Button disabled={pending || !allAnswered} onClick={submit}>
          {pending ? "Checking..." : "Submit checkpoint"}
        </Button>
      ) : grade.passed ? (
        <div className="space-y-2 rounded-[var(--radius)] border border-success/40 bg-success-soft p-4 text-sm">
          <p className="font-display text-base font-semibold text-success">
            Ma sha Allah &mdash; {grade.correctCount}/{grade.total} ({Math.round(grade.score * 100)}%)
          </p>
          <p className="text-success">
            {grade.advancedToNodeId
              ? "Your pod moves on to the next lesson."
              : "That's the final step in this course."}
          </p>
          {grade.advancedToNodeId ? (
            <Button size="sm" variant="primary" onClick={() => router.refresh()}>
              Go to the next lesson
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-2 rounded-[var(--radius)] border border-warning/40 bg-warning-soft p-4 text-sm">
          <p className="font-display text-base font-semibold text-[color:var(--ink)]">
            {grade.correctCount}/{grade.total} ({Math.round(grade.score * 100)}%) &mdash; not there yet
          </p>
          <p className="text-ink-2">Have another look at the lesson above, then try again.</p>
          <Button
            size="sm"
            variant="accent"
            onClick={() => {
              setGrade(null);
              setAnswers({});
            }}
          >
            Try again
          </Button>
        </div>
      )}
    </Card>
  );
}
