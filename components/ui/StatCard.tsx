import type { ReactNode } from "react";

const accents: Record<string, string> = {
  teal: "text-teal",
  terracotta: "text-terracotta",
  mustard: "text-mustard",
  coral: "text-coral",
  ink: "text-ink",
};

export function StatCard({
  label,
  value,
  hint,
  accent = "ink",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: keyof typeof accents;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">{label}</p>
        {icon ? <span className={`${accents[accent]} opacity-70`}>{icon}</span> : null}
      </div>
      <p className={`mt-1.5 font-display text-2xl font-semibold ${accents[accent]}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs leading-snug text-ink-4">{hint}</p> : null}
    </div>
  );
}
