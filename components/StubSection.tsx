// Placeholder card for features not yet built - makes the Phase 1 skeleton
// communicate the intended surface and its build phase (see TASKS.md).

export function StubSection({
  title,
  phase,
  items,
}: {
  title: string;
  phase: string;
  items: string[];
}) {
  return (
    <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{title}</h2>
        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {phase}
        </span>
      </div>
      <ul className="mt-2 space-y-1 text-sm text-zinc-500 dark:text-zinc-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden>·</span>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
