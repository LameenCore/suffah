// Pure render of a generated pod handoff briefing (Continuity Fingerprint, T18).

import { Star8 } from "@/components/ui/Motif";
import type { PodBriefing } from "@/lib/ai/continuity";
import type { Translator } from "@/lib/i18n";

type BriefingStatus = PodBriefing["perCourse"][number]["status"];

const STATUS_STYLE: Record<BriefingStatus, string> = {
  "moving well": "text-success",
  "some friction": "text-warning",
  stuck: "text-danger",
  "not started": "text-ink-4",
};

const STATUS_KEY: Record<BriefingStatus, Parameters<Translator>[0]> = {
  "moving well": "admin.continuity.statusMovingWell",
  "some friction": "admin.continuity.statusSomeFriction",
  stuck: "admin.continuity.statusStuck",
  "not started": "admin.continuity.statusNotStarted",
};

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-strong">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function BriefingView({
  briefing,
  meta,
  t,
}: {
  briefing: PodBriefing;
  meta?: { source: string; generatedAt: string };
  t: Translator;
}) {
  return (
    <div className="space-y-4 rounded-[var(--radius-lg)] border border-teal/30 bg-teal-soft/50 p-5 text-sm">
      <div>
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-strong">
          <Star8 className="h-3.5 w-3.5" /> {t("admin.continuity.briefingLabel")}
          {meta ? (
            <span className="font-normal text-ink-4">
              &middot; {meta.source === "fallback" ? t("admin.continuity.offlineDraft") : ""}
              {new Date(meta.generatedAt).toLocaleString()}
            </span>
          ) : null}
        </p>
        <p className="mt-1.5 font-display text-base font-medium text-ink">{briefing.headline}</p>
      </div>

      <Block label={t("admin.continuity.byCourse")}>
        <ul className="space-y-1.5">
          {briefing.perCourse.map((c) => (
            <li key={c.course} className="text-ink-2">
              <span className="font-medium text-ink">{c.course}</span>{" "}
              <span className="text-ink-4">({c.position})</span>{" "}
              <span className={STATUS_STYLE[c.status]}>&middot; {t(STATUS_KEY[c.status])}</span>
              <br />
              <span className="text-ink-3">{c.note}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block label={t("admin.continuity.students")}>
        <ul className="space-y-0.5">
          {briefing.students.map((s) => (
            <li key={s.name} className="text-ink-2">
              <span className="font-medium text-ink">{s.name}:</span> {s.observation}
            </li>
          ))}
        </ul>
      </Block>

      <Block label={t("admin.continuity.watchFor")}>
        <ul className="list-disc space-y-0.5 pl-5">
          {briefing.watchFor.map((w, i) => (
            <li key={i} className="text-ink-2">
              {w}
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}
