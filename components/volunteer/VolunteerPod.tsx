"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { BriefingView } from "@/components/admin/BriefingView";
import { useT } from "@/lib/i18n/client";
import { BARAKAH_INDICATORS } from "@/lib/db/barakah-queries";
import {
  addVolunteerSessionNoteAction,
  addVolunteerBarakahNoteAction,
  type ActionResult,
} from "@/app/volunteer/actions";
import type { VolunteerPodView } from "@/lib/db/volunteer-portal-queries";

export function VolunteerPod({ pod }: { pod: VolunteerPodView }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [noteCourse, setNoteCourse] = useState("");
  const barakahRef = useRef<HTMLFormElement>(null);

  function submitNote() {
    const text = note.trim();
    if (!text) return;
    setError(null);
    start(async () => {
      const res = await addVolunteerSessionNoteAction(pod.id, text, noteCourse || null);
      if (!res.ok) setError(res.error ?? "action failed");
      else {
        setNote("");
        router.refresh();
      }
    });
  }

  function submitBarakah(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res: ActionResult = await addVolunteerBarakahNoteAction(fd);
      if (!res.ok) setError(res.error ?? "action failed");
      else {
        barakahRef.current?.reset();
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-5 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">{pod.name}</h2>
        <p className="text-xs text-ink-4">
          {pod.students.map((s) => s.name).join(" · ") || t("volunteer.noStudents")}
        </p>
      </div>

      {/* per-course position — read-only */}
      <div className="grid gap-2 sm:grid-cols-3">
        {pod.courses.map((c) => (
          <div key={c.courseId} className="rounded-[var(--radius)] border border-border bg-surface-2 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">
              {c.courseName}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {c.totalNodes > 0
                ? t("volunteer.nodeOf", { n: c.nodePosition, total: c.totalNodes })
                : t("volunteer.notStarted")}
            </p>
            {c.currentNodeTitle ? (
              <p className="mt-0.5 text-xs text-ink-4">{c.currentNodeTitle}</p>
            ) : null}
          </div>
        ))}
      </div>

      {/* handoff briefing — read-only */}
      {pod.briefing ? (
        <BriefingView
          briefing={pod.briefing.content}
          meta={{ source: pod.briefing.source, generatedAt: pod.briefing.generatedAt }}
        />
      ) : (
        <p className="text-xs text-ink-3">{t("volunteer.noBriefing")}</p>
      )}

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      {/* session notes */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
          {t("volunteer.sessionNotes")} ({pod.notes.length})
        </p>
        <ul className="space-y-1">
          {pod.notes.length === 0 ? (
            <li className="text-xs text-ink-4">{t("volunteer.noNotes")}</li>
          ) : (
            pod.notes.map((n) => (
              <li key={n.id} className="text-xs text-ink-2">
                <span className={n.authorKind === "system" ? "text-ink-4" : "font-medium"}>
                  {n.authorKind === "system" ? "system" : n.authorName ?? "volunteer"}
                  {n.courseName ? ` · ${n.courseName}` : ""}
                </span>{" "}
                — {n.note}
              </li>
            ))
          )}
        </ul>
        <div className="flex flex-wrap gap-2">
          <select
            value={noteCourse}
            onChange={(e) => setNoteCourse(e.target.value)}
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
          >
            <option value="">{t("volunteer.noCourse")}</option>
            {pod.courses.map((c) => (
              <option key={c.courseId} value={c.courseId}>
                {c.courseName}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("volunteer.notePlaceholder")}
            className="min-h-11 min-w-[12rem] flex-1 rounded-[var(--radius)] border border-border bg-surface px-3 py-1.5 text-xs text-ink outline-none focus:border-teal"
          />
          <Button size="sm" variant="ghost" disabled={pending || !note.trim()} onClick={submitNote}>
            {t("volunteer.addNote")}
          </Button>
        </div>
      </div>

      {/* barakah check-in */}
      <form
        ref={barakahRef}
        onSubmit={submitBarakah}
        className="space-y-2 rounded-[var(--radius)] border border-dashed border-border bg-surface-2 p-3"
      >
        <input type="hidden" name="podId" value={pod.id} />
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">
          {t("volunteer.barakahTitle")}
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            name="studentUserId"
            defaultValue=""
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
          >
            <option value="">{t("volunteer.wholePod")}</option>
            {pod.students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            name="indicator"
            defaultValue={BARAKAH_INDICATORS[0].key}
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
          >
            {BARAKAH_INDICATORS.map((i) => (
              <option key={i.key} value={i.key}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="note"
          rows={2}
          required
          placeholder={t("volunteer.barakahPlaceholder")}
          className="w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {t("volunteer.recordNote")}
        </Button>
      </form>
    </section>
  );
}
