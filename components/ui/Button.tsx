import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "accent" | "soft" | "ghost" | "danger";
type Size = "sm" | "md";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-55";

const sizes: Record<Size, string> = {
  sm: "px-3.5 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
};

const variants: Record<Variant, string> = {
  primary: "bg-teal text-white hover:bg-teal-strong shadow-sm",
  accent: "bg-terracotta text-white hover:bg-terracotta-strong shadow-sm",
  soft: "bg-teal-soft text-teal-strong hover:brightness-95",
  ghost:
    "border border-border-strong bg-surface text-ink-2 hover:border-teal hover:text-teal",
  danger: "bg-danger text-white hover:brightness-95 shadow-sm",
};

function classes(variant: Variant, size: Size, className?: string) {
  return `${base} ${sizes[size]} ${variants[variant]} ${className ?? ""}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button className={classes(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
