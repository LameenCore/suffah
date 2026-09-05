import type { ReactNode } from "react";

/**
 * The surface primitive. `tone` tints the whole card; `accent` adds a coloured
 * left edge for status; `motif` drops a faint eight-pointed-star field behind it.
 */
export function Card({
  children,
  className,
  tone = "surface",
  accent,
  motif = false,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  tone?: "surface" | "muted" | "teal" | "terracotta" | "mustard" | "success" | "warning" | "danger";
  accent?: "teal" | "terracotta" | "mustard" | "success" | "warning" | "danger";
  motif?: boolean;
  as?: "div" | "section" | "article" | "li";
}) {
  const tones: Record<string, string> = {
    surface: "bg-surface border-border",
    muted: "bg-surface-2 border-border",
    teal: "bg-teal-soft border-teal/30",
    terracotta: "bg-terracotta-soft border-terracotta/30",
    mustard: "bg-mustard-soft border-mustard/40",
    success: "bg-success-soft border-success/30",
    warning: "bg-warning-soft border-warning/40",
    danger: "bg-danger-soft border-danger/30",
  };
  const accents: Record<string, string> = {
    teal: "before:bg-teal",
    terracotta: "before:bg-terracotta",
    mustard: "before:bg-mustard",
    success: "before:bg-success",
    warning: "before:bg-warning",
    danger: "before:bg-danger",
  };

  return (
    <As
      className={`relative overflow-hidden rounded-[var(--radius-lg)] border shadow-[var(--shadow-card)] ${
        tones[tone]
      } ${
        accent
          ? `before:absolute before:inset-y-0 before:left-0 before:w-1.5 ${accents[accent]}`
          : ""
      } ${className ?? ""}`}
    >
      {motif ? (
        <div
          className="geo-field pointer-events-none absolute inset-0 opacity-40"
          aria-hidden
        />
      ) : null}
      <div className="relative">{children}</div>
    </As>
  );
}
