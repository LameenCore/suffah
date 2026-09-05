// Renders a persisted lesson (LessonContent). Pure presentation.

import { RegulationNote } from "@/components/RegulationNote";
import { Card } from "@/components/ui/Card";
import { Flourish, Lantern } from "@/components/ui/Motif";
import type { LessonContent } from "@/lib/ai/lesson";

export function LessonView({
  title,
  lesson,
}: {
  title: string;
  lesson: LessonContent;
}) {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <h1 className="font-display text-3xl font-semibold text-ink">{title}</h1>
        <p className="text-[15px] leading-relaxed text-ink-2">{lesson.summary}</p>
        <p className="text-[11px] uppercase tracking-wide text-ink-4">
          {lesson.generatedBy === "fallback"
            ? "Offline lesson content"
            : `Prepared by ${lesson.generatedBy}`}
        </p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          <Lantern className="h-4 w-4 text-mustard" /> By the end of this lesson
        </h2>
        <ul className="space-y-1.5">
          {lesson.objectives.map((o) => (
            <li key={o} className="flex gap-2.5 text-sm text-ink-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
              {o}
            </li>
          ))}
        </ul>
      </section>

      <div className="space-y-7">
        {lesson.sections.map((s) => (
          <section key={s.heading} className="space-y-2.5">
            <h2 className="font-display text-xl font-semibold text-ink">{s.heading}</h2>
            {s.body.split(/\n{2,}/).map((para, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-ink-2">
                {para}
              </p>
            ))}
          </section>
        ))}
      </div>

      <Flourish className="mx-auto h-3 w-40 text-terracotta/40" />

      <Card tone="muted" className="p-5">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Worked example
        </h2>
        <p className="font-medium text-ink">{lesson.worked_example.prompt}</p>
        <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">
          {lesson.worked_example.solution}
        </p>
      </Card>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Practice - check yourself
        </h2>
        <ol className="space-y-3">
          {lesson.practice.map((p, i) => (
            <li
              key={i}
              className="rounded-[var(--radius)] border border-border bg-surface p-4 text-sm"
            >
              <p className="font-medium text-ink">{p.prompt}</p>
              <details className="mt-2 text-ink-3">
                <summary className="cursor-pointer select-none font-medium text-terracotta">
                  Show answer
                </summary>
                <p className="mt-1.5">
                  <span className="font-semibold text-ink">Answer:</span> {p.answer}
                </p>
                <p className="mt-1">{p.explanation}</p>
              </details>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Key terms
        </h2>
        <dl className="grid gap-2 sm:grid-cols-2">
          {lesson.key_terms.map((t) => (
            <div
              key={t.term}
              className="rounded-[var(--radius)] border border-border bg-surface p-3"
            >
              <dt className="font-display text-sm font-semibold text-ink">{t.term}</dt>
              <dd className="mt-0.5 text-sm text-ink-3">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </section>

      {lesson.regulationNote ? <RegulationNote>{lesson.regulationNote}</RegulationNote> : null}
    </article>
  );
}
