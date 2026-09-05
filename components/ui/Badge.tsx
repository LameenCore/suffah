import type { ReactNode } from "react";

type Tone = "neutral" | "teal" | "terracotta" | "mustard" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-3 border-border",
  teal: "bg-teal-soft text-teal-strong border-teal/30",
  terracotta: "bg-terracotta-soft text-terracotta-strong border-terracotta/30",
  mustard: "bg-mustard-soft text-[color:var(--ink)] border-mustard/40",
  success: "bg-success-soft text-success border-success/30",
  warning: "bg-warning-soft text-[color:var(--ink)] border-warning/40",
  danger: "bg-danger-soft text-danger border-danger/30",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  dot = false,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${tones[tone]} ${className ?? ""}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" /> : null}
      {children}
    </span>
  );
}
