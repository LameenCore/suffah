// Pure render of a generated pod handoff briefing (Continuity Fingerprint, T18).

import type { PodBriefing } from "@/lib/ai/continuity";

const STATUS_STYLE: Record<PodBriefing["perCourse"][number]["status"], string> = {
  "moving well": "text-emerald-700 dark:text-emerald-400",
  "some friction": "text-amber-700 dark:text-amber-400",
  stuck: "text-red-700 dark:text-red-400",
  "not started": "text-zinc-400",
};

export function BriefingView({
  briefing,
  meta,
}: {
  briefing: PodBriefing;
  meta?: { source: string; generatedAt: string };
}) {
  return (
    <div className="space-y-4 rounded-lg border border-emerald-300/70 bg-emerald-50/60 p-4 text-sm dark:border-emerald-700/50 dark:bg-emerald-950/30">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Handoff briefing
          {meta ? (
            <span className="ml-2 font-normal text-emerald-600/70 dark:text-emerald-500/70">
              {meta.source === "fallback" ? "offline draft · " : ""}
              {new Date(meta.generatedAt).toLocaleString()}
            </span>
          ) : null}
        </p>
        <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-100">{briefing.headline}</p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">By course</p>
        <ul className="mt-1 space-y-1">
          {briefing.perCourse.map((c) => (
            <li key={c.course} className="text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">{c.course}</span>{" "}
              <span className="text-zinc-400">({c.position})</span>{" "}
              <span className={STATUS_STYLE[c.status]}>· {c.status}</span>
              <br />
              <span className="text-zinc-500 dark:text-zinc-400">{c.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Students</p>
        <ul className="mt-1 space-y-0.5">
          {briefing.students.map((s) => (
            <li key={s.name} className="text-zinc-700 dark:text-zinc-300">
              <span className="font-medium">{s.name}:</span> {s.observation}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          Watch for on day one
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {briefing.watchFor.map((w, i) => (
            <li key={i} className="text-zinc-700 dark:text-zinc-300">
              {w}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
