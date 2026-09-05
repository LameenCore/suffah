// Pure render of a generated pod handoff briefing (Continuity Fingerprint, T18).

import type { PodBriefing } from "@/lib/ai/continuity";

const STATUS_STYLE: Record<PodBriefing["perCourse"][number]["status"], string> = {
  "moving well": "text-teal-strong ",
  "some friction": "text-amber-700 ",
  stuck: "text-red-700 dark:text-red-400",
  "not started": "text-ink-4",
};

export function BriefingView({
  briefing,
  meta,
}: {
  briefing: PodBriefing;
  meta?: { source: string; generatedAt: string };
}) {
  return (
    <div className="space-y-4 rounded-lg border border-success/40/70 bg-success-soft/60 p-4 text-sm  ">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-strong ">
          Handoff briefing
          {meta ? (
            <span className="ml-2 font-normal text-teal/70 /70">
              {meta.source === "fallback" ? "offline draft · " : ""}
              {new Date(meta.generatedAt).toLocaleString()}
            </span>
          ) : null}
        </p>
        <p className="mt-1 font-medium text-ink ">{briefing.headline}</p>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">By course</p>
        <ul className="mt-1 space-y-1">
          {briefing.perCourse.map((c) => (
            <li key={c.course} className="text-ink-2 ">
              <span className="font-medium">{c.course}</span>{" "}
              <span className="text-ink-4">({c.position})</span>{" "}
              <span className={STATUS_STYLE[c.status]}>· {c.status}</span>
              <br />
              <span className="text-ink-3 ">{c.note}</span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">Students</p>
        <ul className="mt-1 space-y-0.5">
          {briefing.students.map((s) => (
            <li key={s.name} className="text-ink-2 ">
              <span className="font-medium">{s.name}:</span> {s.observation}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-3">
          Watch for on day one
        </p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          {briefing.watchFor.map((w, i) => (
            <li key={i} className="text-ink-2 ">
              {w}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
