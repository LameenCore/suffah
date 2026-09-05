"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  addBarakahNoteAction,
  type ActionResult,
} from "@/app/admin/barakah/actions";
import { BARAKAH_INDICATORS, type BarakahEntry } from "@/lib/db/barakah-queries";

export interface PodOption {
  id: string;
  name: string;
  students: { id: string; name: string }[];
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

export function BarakahCheckIn({
  pods,
  recentNotes,
}: {
  pods: PodOption[];
  recentNotes: BarakahEntry[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [podId, setPodId] = useState(pods[0]?.id ?? "");

  const students = useMemo(
    () => pods.find((p) => p.id === podId)?.students ?? [],
    [pods, podId],
  );

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res: ActionResult = await addBarakahNoteAction(fd);
      if (!res.ok) setError(res.error ?? "action failed");
      else {
        formRef.current?.reset();
        setPodId(pods[0]?.id ?? "");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        onSubmit={submit}
        className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950"
      >
        <h2 className="font-medium">Weekly check-in</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          A short observation about consistency, cooperation, reflection, or adab.
          Not a grade - these are never scored or ranked.
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Pod</span>
            <select
              name="podId"
              value={podId}
              onChange={(e) => setPodId(e.target.value)}
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
            >
              {pods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">About</span>
            <select
              name="studentUserId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
            >
              <option value="">The whole pod</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Indicator</span>
            <select
              name="indicator"
              defaultValue={BARAKAH_INDICATORS[0].key}
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
            >
              {BARAKAH_INDICATORS.map((i) => (
                <option key={i.key} value={i.key}>{i.label}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              Recorded by
            </span>
            <input
              name="recordedBy"
              defaultValue="Br. Kareem"
              className="mt-1 w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Note</span>
          <textarea
            name="note"
            rows={2}
            required
            className="mt-1 w-full rounded-md border border-black/15 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-zinc-900"
            placeholder="e.g. Helped a podmate without being asked."
          />
        </label>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? "Saving…" : "Record note"}
          </button>
          {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
        </div>
      </form>

      <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
        <h2 className="font-medium">Recent notes</h2>
        {recentNotes.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No notes recorded yet.</p>
        ) : (
          <ul className="mt-1 divide-y divide-black/5 dark:divide-white/10">
            {recentNotes.map((n) => (
              <li key={n.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">
                    {n.studentName ?? `${n.podName} (whole pod)`}
                  </span>
                  <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {n.indicatorLabel}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {fmtDate(n.recordedAt)} · {n.recordedBy}
                  </span>
                </div>
                {n.note && (
                  <p className="mt-0.5 text-zinc-600 dark:text-zinc-300">{n.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
