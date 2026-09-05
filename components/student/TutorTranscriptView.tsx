import type { TutorTranscript } from "@/lib/ai/tutor";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const time = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

export function TutorTranscriptView({
  transcripts,
  title = "Lesson questions",
}: {
  transcripts: TutorTranscript[];
  title?: string;
}) {
  if (transcripts.length === 0) {
    return (
      <Card className="p-4 text-sm text-ink-4">
        {title}: none asked yet.
      </Card>
    );
  }
  return (
    <Card as="section" className="space-y-4 p-5">
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      {transcripts.map((t) => (
        <div key={t.nodeId} className="space-y-2">
          <p className="text-xs font-medium text-ink-4">
            {t.courseName} · {t.nodeTitle}
          </p>
          <ul className="space-y-1.5 border-l-2 border-border pl-3">
            {t.turns.map((turn, i) => (
              <li key={i} className="text-sm">
                <span className="mr-1.5 text-xs font-semibold text-ink-4">
                  {turn.role === "student" ? "Asked" : "Helper"}
                </span>
                <span className={turn.flagged ? "text-ink-3" : "text-ink-2"}>
                  {turn.content}
                </span>
                {turn.flagged ? (
                  <Badge tone="warning" className="ml-2 align-middle">
                    redirected
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
