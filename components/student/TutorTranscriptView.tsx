import type { TutorTranscript } from "@/lib/ai/tutor";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { Translator } from "@/lib/i18n";

export function TutorTranscriptView({
  transcripts,
  t,
  intlLocale,
  title,
}: {
  transcripts: TutorTranscript[];
  t: Translator;
  intlLocale: string;
  /** Override the default "Lesson questions" heading with an already-translated string. */
  title?: string;
}) {
  const heading = title ?? t("compliance.tutorTitle");
  const time = (iso: string) =>
    new Date(iso).toLocaleDateString(intlLocale, { month: "short", day: "numeric" });

  if (transcripts.length === 0) {
    return (
      <Card className="p-4 text-sm text-ink-4">
        {t("compliance.tutorNone", { title: heading })}
      </Card>
    );
  }
  return (
    <Card as="section" className="space-y-4 p-5">
      <h3 className="font-display text-lg font-semibold text-ink">{heading}</h3>
      {transcripts.map((tr) => (
        <div key={tr.nodeId} className="space-y-2">
          <p className="text-xs font-medium text-ink-4">
            {tr.courseName} · {tr.nodeTitle}
          </p>
          <ul className="space-y-1.5 border-l-2 border-border pl-3">
            {tr.turns.map((turn, i) => (
              <li key={i} className="text-sm">
                <span className="mr-1.5 text-xs font-semibold text-ink-4">
                  {turn.role === "student"
                    ? t("compliance.tutorAsked")
                    : t("compliance.tutorHelper")}
                </span>
                <span className={turn.flagged ? "text-ink-3" : "text-ink-2"}>
                  {turn.content}
                </span>
                {turn.flagged ? (
                  <Badge tone="warning" className="ml-2 align-middle">
                    {t("compliance.tutorRedirected")}
                  </Badge>
                ) : null}
                {turn.role === "student" ? (
                  <span className="ml-2 text-xs text-ink-4">{time(turn.at)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}
