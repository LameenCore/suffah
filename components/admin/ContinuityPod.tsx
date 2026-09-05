"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BriefingView } from "@/components/admin/BriefingView";
import { Button } from "@/components/ui/Button";
import {
  generateBriefingAction,
  addSessionNoteAction,
} from "@/app/admin/continuity/actions";
import type { PodBriefing } from "@/lib/ai/continuity";
import type { PodSessionNote } from "@/lib/db/continuity-queries";

export interface ContinuityPodData {
  id: string;
  name: string;
  volunteerName: string | null;
  courses: { id: string; name: string }[];
  notes: PodSessionNote[];
  briefing: { content: PodBriefing; source: string; generatedAt: string } | null;
}

export function ContinuityPod({ pod }: { pod: ContinuityPodData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [briefing, setBriefing] = useState(pod.briefing);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteCourse, setNoteCourse] = useState<string>("");

  function generate() {
    startTransition(async () => {
      setError(null);
      try {
        const r = await generateBriefingAction(pod.id);
        setBriefing({ content: r.briefing, source: r.source, generatedAt: r.generatedAt });
      } catch (e) {
        setError(e instanceof Error ? e.message : "could not generate briefing");
      }
    });
  }

  function submitNote() {
    const text = note.trim();
    if (!text) return;
    startTransition(async () => {
      setError(null);
      try {
        await addSessionNoteAction(pod.id, text, noteCourse || null);
        setNote("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "could not save note");
      }
    });
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{pod.name}</h2>
          <p className="text-xs text-ink-4">
            Volunteer: {pod.volunteerName ?? "unassigned"}
          </p>
        </div>
        <Button size="sm" disabled={pending} onClick={generate}>
          {pending
            ? "Generating..."
            : briefing
              ? "Regenerate briefing"
              : "Generate handoff briefing"}
        </Button>
      </div>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {briefing ? (
        <BriefingView
          briefing={briefing.content}
          meta={{ source: briefing.source, generatedAt: briefing.generatedAt }}
        />
      ) : (
        <p className="text-xs text-ink-3">
          No briefing yet. Generate one to see how this pod has been learning - where it got
          stuck, which students needed extra attempts, what the notes say.
        </p>
      )}

      <details className="text-sm">
        <summary className="cursor-pointer select-none text-xs font-semibold uppercase tracking-wide text-ink-3">
          Session notes ({pod.notes.length})
        </summary>
        <div className="mt-2 space-y-2">
          <ul className="space-y-1">
            {pod.notes.length === 0 ? (
              <li className="text-xs text-ink-4">No notes yet.</li>
            ) : (
              pod.notes.map((n) => (
                <li key={n.id} className="text-xs text-ink-2 ">
                  <span
                    className={
                      n.authorKind === "system"
                        ? "text-ink-4"
                        : "font-medium text-ink-2 "
                    }
                  >
                    {n.authorKind === "system" ? "system" : n.authorName ?? "volunteer"}
                    {n.courseName ? ` · ${n.courseName}` : ""}
                  </span>{" "}
                  - {n.note}
                </li>
              ))
            )}
          </ul>
          <div className="flex flex-wrap gap-2">
            <select
              value={noteCourse}
              onChange={(e) => setNoteCourse(e.target.value)}
              className="rounded-md border border-border bg-surface px-2 py-1 text-xs  "
            >
              <option value="">(no course)</option>
              {pod.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="After today's session..."
              className="min-w-[12rem] flex-1 rounded-[var(--radius)] border border-border bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-teal"
            />
            <Button size="sm" variant="ghost" disabled={pending || !note.trim()} onClick={submitNote}>
              Add note
            </Button>
          </div>
        </div>
      </details>
    </section>
  );
}
