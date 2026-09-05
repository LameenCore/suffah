import Link from "next/link";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  lede,
  back,
  actions,
  kicker,
}: {
  title: ReactNode;
  lede?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
  kicker?: ReactNode;
}) {
  return (
    <header className="space-y-3">
      {back ? (
        <Link
          href={back.href}
          className="inline-flex items-center gap-1 text-sm text-ink-3 transition-colors hover:text-teal"
        >
          <span aria-hidden>&larr;</span> {back.label}
        </Link>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          {kicker ? (
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
              {kicker}
            </p>
          ) : null}
          <h1 className="text-2xl sm:text-[1.75rem]">{title}</h1>
          {lede ? <p className="max-w-2xl text-sm text-ink-3">{lede}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
        {children}
      </h2>
      {hint ? <span className="text-xs text-ink-4">{hint}</span> : null}
    </div>
  );
}
