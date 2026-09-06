import Link from "next/link";
import type { CourseTrack } from "@/lib/db/queries";
import type { Translator } from "@/lib/i18n";
import { Badge } from "@/components/ui/Badge";
import { BookMark, Crescent, Star8 } from "@/components/ui/Motif";

function CourseIcon({ name }: { name: string }) {
  if (name === "Math") {
    return (
      <span className="font-display text-base font-semibold leading-none">
        &plusmn;<span className="text-sm">n</span>
      </span>
    );
  }
  if (name === "Seerah") return <BookMark className="h-5 w-5" />;
  return <Star8 className="h-5 w-5" />;
}

export function CoursePath({ track, t }: { track: CourseTrack; t: Translator }) {
  const { course, nodes, currentNode, lessonComplete, checkpointPassed, position, total } =
    track;
  const cp = (k: string) => t(`student.coursePath.${k}` as Parameters<Translator>[0]);

  const cta = !currentNode
    ? { label: cp("notAssigned"), disabled: true }
    : checkpointPassed
      ? { label: cp("review"), disabled: false }
      : lessonComplete
        ? { label: cp("takeCheckpoint"), disabled: false }
        : currentNode.lesson_content
          ? { label: cp("continueLesson"), disabled: false }
          : { label: cp("startLesson"), disabled: false };

  const status = !currentNode
    ? null
    : checkpointPassed
      ? { tone: "success" as const, text: cp("stateDone") }
      : lessonComplete
        ? { tone: "mustard" as const, text: cp("stateQuiz") }
        : { tone: "teal" as const, text: cp("stateReady") };

  const shell = `group flex h-full flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)] transition-all ${
    currentNode
      ? "hover:-translate-y-0.5 hover:border-terracotta hover:shadow-[var(--shadow-pop)]"
      : ""
  }`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mustard-soft text-terracotta-strong">
            <CourseIcon name={course.name} />
          </span>
          <div>
            <h3 className="font-display text-lg font-semibold leading-tight text-ink">
              {course.name}
            </h3>
            <p className="text-xs text-ink-4">
              {total > 0
                ? t("student.coursePath.step", { n: Math.max(position, 1), total })
                : cp("noPath")}
            </p>
          </div>
        </div>
        {status ? (
          <Badge tone={status.tone} className="mt-0.5 shrink-0">
            {status.text}
          </Badge>
        ) : null}
      </div>

      {nodes.length > 0 ? (
        <ol className="mt-5 flex items-center">
          {nodes.map((n, i) => (
            <li key={n.id} className="flex flex-1 items-center last:flex-none">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-[11px] font-semibold ${
                  n.state === "done"
                    ? "border-teal bg-teal text-white"
                    : n.state === "current"
                      ? "border-terracotta bg-terracotta-soft text-terracotta-strong"
                      : "border-border-strong bg-surface-2 text-ink-4"
                }`}
                title={n.title}
              >
                {n.state === "done" ? "✓" : n.sequence_order}
              </span>
              {i < nodes.length - 1 ? (
                <span
                  className={`mx-1 h-0.5 flex-1 rounded ${
                    n.state === "done" ? "bg-teal/50" : "bg-border-strong"
                  }`}
                />
              ) : null}
            </li>
          ))}
        </ol>
      ) : null}

      <p className="mt-4 line-clamp-2 flex-1 text-sm text-ink-2">
        {currentNode ? currentNode.title : cp("askPlacement")}
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-terracotta">
        {cta.disabled ? (
          <span className="text-ink-4">{cta.label}</span>
        ) : (
          <>
            <Crescent className="h-4 w-4" />
            <span>{cta.label}</span>
            <span className="transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </>
        )}
      </div>
    </>
  );

  if (currentNode) {
    return (
      <Link href={`/student/${course.id}`} className={shell}>
        {body}
      </Link>
    );
  }
  return <div className={shell}>{body}</div>;
}
