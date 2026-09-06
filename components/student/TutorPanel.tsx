"use client";

import { useRef, useState, useTransition } from "react";
import { askTutorAction } from "@/app/student/actions";
import type { TutorTurn } from "@/lib/ai/tutor";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Lantern } from "@/components/ui/Motif";
import { useT } from "@/lib/i18n/client";

export function TutorPanel({ nodeId }: { nodeId: string }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<TutorTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const endRef = useRef<HTMLDivElement>(null);
  const t = useT();

  function send() {
    const q = draft.trim();
    if (!q || pending) return;
    setError(null);
    setDraft("");
    const history = turns;
    setTurns((t) => [...t, { role: "student", content: q }]);
    start(async () => {
      try {
        const reply = await askTutorAction(nodeId, q, history);
        setTurns((t) => [...t, { role: "tutor", content: reply.answer, flagged: reply.flagged }]);
        requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
      } catch (e) {
        setError(
          e instanceof Error && e.name === "RateLimitError"
            ? t("student.tutor.rateLimited")
            : t("student.tutor.unavailable"),
        );
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2.5 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface px-4 py-3 text-sm text-ink-2 transition-colors hover:border-teal hover:text-teal"
      >
        <Lantern className="h-4 w-4 text-mustard" />
        {t("student.tutor.openCta")}
      </button>
    );
  }

  return (
    <Card className="space-y-3 p-5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          <Lantern className="h-4 w-4 text-mustard" /> {t("student.tutor.heading")}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-ink-4 hover:text-ink"
        >
          {t("student.tutor.close")}
        </button>
      </div>

      <p className="text-xs text-ink-4">
        {t("student.tutor.note")}
      </p>

      {turns.length > 0 ? (
        <div className="max-h-72 space-y-2.5 overflow-y-auto rounded-[var(--radius)] bg-surface-2 p-3">
          {turns.map((turn, i) => (
            <div
              key={i}
              className={`text-sm ${
                turn.role === "student" ? "text-ink" : turn.flagged ? "text-ink-3" : "text-ink-2"
              }`}
            >
              <span className="mr-1.5 text-xs font-semibold text-ink-4">
                {turn.role === "student" ? t("student.tutor.you") : t("student.tutor.helper")}
              </span>
              {turn.content}
            </div>
          ))}
          {pending ? <p className="text-xs text-ink-4">{t("student.tutor.thinking")}</p> : null}
          <div ref={endRef} />
        </div>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          maxLength={600}
          placeholder={t("student.tutor.placeholder")}
          className="flex-1 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal"
        />
        <Button size="sm" disabled={pending || !draft.trim()} onClick={send}>
          {t("student.tutor.ask")}
        </Button>
      </div>
    </Card>
  );
}
