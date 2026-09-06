"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startCheckpointAction, submitCheckpointAction } from "@/app/student/actions";
import type { CheckpointForStudent, CheckpointGrade } from "@/lib/ai/checkpoint";
import { useT } from "@/lib/i18n/client";
import { enqueueAttempt, saveDraft, getDraft, clearDraft } from "@/lib/offline/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Crescent } from "@/components/ui/Motif";

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
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [grade, setGrade] = useState<CheckpointGrade | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queued, setQueued] = useState(false);
  const cp = (k: string) => t(`student.checkpoint.${k}` as Parameters<typeof t>[0]);
  const heading = (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
      <Crescent className="h-4 w-4 text-terracotta" /> {cp("heading")}
    </h2>
  );

  // Restore a crash / drop draft, and clear the "queued" banner once the SW
  // reports this node synced.
  useEffect(() => {
    let alive = true;
    getDraft(nodeId).then((d) => {
      if (alive && d && Object.keys(d).length) setAnswers((a) => ({ ...d, ...a }));
    });
    const onResult = (e: Event) => {
      const detail = (e as CustomEvent).detail as { nodeId?: string; ok?: boolean };
      if (detail?.nodeId === nodeId && detail.ok) {
        setQueued(false);
        router.refresh();
      }
    };
    window.addEventListener("suffa:sync-result", onResult as EventListener);
    return () => {
      alive = false;
      window.removeEventListener("suffa:sync-result", onResult as EventListener);
    };
  }, [nodeId, router]);

  // Every answer change is persisted immediately — a mid-checkpoint network drop
  // or a reload never loses work.
  const updateAnswer = useCallback(
    (id: string, value: string) => {
      setAnswers((a) => {
        const next = { ...a, [id]: value };
        void saveDraft(nodeId, next);
        return next;
      });
    },
    [nodeId],
  );

  if (priorPassed && !grade) {
    return (
      <Card tone="success" className="space-y-2 p-5">
        {heading}
        <p className="text-sm text-success">
          {cp("passedAlready")}
          {isLastNode ? cp("finalStep") : ""}
        </p>
      </Card>
    );
  }

  if (!checkpoint) {
    return (
      <Card className="space-y-3 p-5">
        {heading}
        <p className="text-sm text-ink-3">{cp("intro")}</p>
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
                setError(e instanceof Error ? e.message : cp("couldNotStart"));
              }
            })
          }
        >
          {pending ? cp("preparing") : cp("start")}
        </Button>
        {error ? <p className="text-xs text-danger">{error}</p> : null}
      </Card>
    );
  }

  const gradeById = new Map(grade?.perQuestion.map((g) => [g.id, g]) ?? []);
  const allAnswered = checkpoint.questions.every((q) => (answers[q.id] ?? "") !== "");

  async function queueOffline() {
    await enqueueAttempt(nodeId, answers);
    await clearDraft(nodeId);
    setQueued(true);
    // Ask the SW to sync as soon as the network is back (Background Sync where
    // available; otherwise the page nudges it on the `online` event).
    try {
      const reg = await navigator.serviceWorker?.ready;
      if (reg && "sync" in reg) {
        await (reg as ServiceWorkerRegistration & { sync: { register(t: string): Promise<void> } }).sync.register(
          "suffa-checkpoint-sync",
        );
      }
    } catch {
      /* offline queue still flushes via the page's online handler */
    }
  }

  function submit() {
    if (navigator.onLine === false) {
      startTransition(async () => {
        setError(null);
        try {
          await queueOffline();
        } catch (e) {
          setError(e instanceof Error ? e.message : t("offline.queueFailed"));
        }
      });
      return;
    }
    startTransition(async () => {
      setError(null);
      try {
        const g = await submitCheckpointAction(nodeId, answers);
        setGrade(g);
        void clearDraft(nodeId);
      } catch (e) {
        // A silent connectivity drop between the online check and the action —
        // fall back to the offline queue rather than losing the attempt.
        if (navigator.onLine === false) {
          try {
            await queueOffline();
            return;
          } catch {
            /* fall through to the error */
          }
        }
        setError(e instanceof Error ? e.message : cp("gradingFailed"));
      }
    });
  }

  return (
    <Card className="space-y-5 p-5">
      {heading}

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
                          onChange={(e) => updateAnswer(q.id, e.target.value)}
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
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  placeholder={cp("yourAnswer")}
                  className="w-full max-w-xs rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-terracotta"
                />
              )}

              {g ? (
                <p className={`text-xs ${g.correct ? "text-success" : "text-danger"}`}>
                  {g.correct ? cp("correct") : t("student.checkpoint.notQuite", { answer: g.correctAnswer })}{" "}
                  <span className="text-ink-4">{g.explanation}</span>
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {queued ? (
        <div className="space-y-1 rounded-[var(--radius)] border border-warning/40 bg-warning-soft p-4 text-sm">
          <p className="font-medium text-[color:var(--ink)]">{t("offline.queuedTitle")}</p>
          <p className="text-ink-2">{t("offline.queuedBody")}</p>
        </div>
      ) : !grade ? (
        <Button disabled={pending || !allAnswered} onClick={submit}>
          {pending ? cp("checking") : cp("submit")}
        </Button>
      ) : grade.passed ? (
        <div className="space-y-2 rounded-[var(--radius)] border border-success/40 bg-success-soft p-4 text-sm">
          <p className="font-display text-base font-semibold text-success">
            {t("student.checkpoint.passHeadline", {
              correct: grade.correctCount,
              total: grade.total,
              pct: Math.round(grade.score * 100),
            })}
          </p>
          <p className="text-success">
            {grade.advancedToNodeId ? cp("passAdvance") : cp("passFinal")}
          </p>
          {grade.advancedToNodeId ? (
            <Button size="sm" variant="primary" onClick={() => router.refresh()}>
              {cp("goNext")}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3 rounded-[var(--radius)] border border-warning/40 bg-warning-soft p-4 text-sm">
          <p className="font-display text-base font-semibold text-[color:var(--ink)]">
            {t("student.checkpoint.failHeadline", {
              correct: grade.correctCount,
              total: grade.total,
              pct: Math.round(grade.score * 100),
            })}
          </p>
          {grade.remediation ? (
            <div className="space-y-2 rounded-[var(--radius)] bg-surface p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-terracotta">
                {cp("reteachTitle")}
              </p>
              <p className="text-ink-2">{grade.remediation.summary}</p>
              <ul className="list-disc space-y-1 pl-4 text-ink-2">
                {grade.remediation.points.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
              {grade.remediation.examples.map((ex, i) => (
                <div key={i} className="rounded-[var(--radius)] bg-surface-2 p-2.5 text-xs">
                  <p className="font-medium text-ink">{ex.prompt}</p>
                  <p className="mt-1 text-ink-2">{ex.solution}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-ink-2">{cp("failBody")}</p>
          )}
          <Button
            size="sm"
            variant="accent"
            onClick={() => {
              setGrade(null);
              setAnswers({});
            }}
          >
            {grade.remediation ? cp("tryAgainRead") : cp("tryAgain")}
          </Button>
        </div>
      )}
    </Card>
  );
}
