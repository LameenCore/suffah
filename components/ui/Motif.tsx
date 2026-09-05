import type { SVGProps } from "react";

/* Small decorative marks. currentColor-driven so callers set the hue. */

export function Star8({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden {...props}>
      <path
        d="M24 3l5.6 9.7L40 15l-5.7 9 5.7 9-10.4 2.3L24 45l-5.6-9.7L8 33l5.7-9L8 15l10.4-2.3z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function Crescent({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden {...props}>
      <path
        d="M17 3.5A9 9 0 1 0 20.5 15 7 7 0 0 1 17 3.5z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Lantern({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 32" fill="none" className={className} aria-hidden {...props}>
      <path d="M9 3h6M12 3V1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="6" y="6" width="12" height="18" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 10.5l2.2 3L12 16.5l-2.2-3z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M8 24h8l-1.5 4h-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function BookMark({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden {...props}>
      <path
        d="M5 4.5A1.5 1.5 0 0 1 6.5 3H18a1 1 0 0 1 1 1v15.5a.5.5 0 0 1-.8.4L12 16l-6.2 4.3A.5.5 0 0 1 5 20z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 8h6M9 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function Dome({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} aria-hidden {...props}>
      <path d="M16 1c4 3 6 6.5 6 10H10c0-3.5 2-7 6-10z" fill="currentColor" opacity="0.9" />
      <path d="M6 11h20v11H6z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 11h20M2 22h28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M14 22v-5a2 2 0 0 1 4 0v5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M16 1V-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** A slim calligraphy-inspired flourish for section breaks. Decorative only. */
export function Flourish({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 12"
      fill="none"
      className={className}
      aria-hidden
      preserveAspectRatio="none"
    >
      <path
        d="M2 6c30 0 30-4 48-4s22 8 50 8 32-8 50-8 22 4 48 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.6"
      />
      <circle cx="100" cy="6" r="2.4" fill="currentColor" opacity="0.7" />
    </svg>
  );
}
