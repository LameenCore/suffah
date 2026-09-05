/**
 * Fanoos - the playground companion. A friendly lantern with a warm glow.
 * Deliberately simple and calm, not cartoonish; reads fine at 32-120px.
 */
export function Mascot({
  size = 72,
  className,
  mood = "happy",
}: {
  size?: number;
  className?: string;
  mood?: "happy" | "thinking" | "cheer";
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 96 96"
      fill="none"
      className={className}
      role="img"
      aria-label="Fanoos, your learning companion"
    >
      {/* glow */}
      <circle cx="48" cy="52" r="30" fill="var(--mustard)" opacity="0.16" />
      {/* handle */}
      <path
        d="M38 20c0-6 4-10 10-10s10 4 10 10"
        stroke="var(--terracotta-strong)"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* top cap */}
      <path d="M34 24h28l-4 6H38z" fill="var(--terracotta)" />
      {/* body */}
      <rect x="30" y="30" width="36" height="44" rx="12" fill="var(--mustard-soft)" stroke="var(--terracotta)" strokeWidth="3" />
      {/* window frame - eight-point hint */}
      <path
        d="M48 38l4 6 7 1-5 5 1 7-7-3-7 3 1-7-5-5 7-1z"
        fill="var(--mustard)"
        opacity="0.5"
      />
      {/* face */}
      {mood === "thinking" ? (
        <>
          <circle cx="42" cy="52" r="2.4" fill="var(--terracotta-strong)" />
          <circle cx="55" cy="52" r="2.4" fill="var(--terracotta-strong)" />
          <path d="M43 61c2-1.5 6-1.5 8 1" stroke="var(--terracotta-strong)" strokeWidth="2.4" strokeLinecap="round" />
        </>
      ) : mood === "cheer" ? (
        <>
          <path d="M39 51c1.5-2 4-2 5 0M52 51c1.5-2 4-2 5 0" stroke="var(--terracotta-strong)" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M42 58c2 4 10 4 12 0" stroke="var(--terracotta-strong)" strokeWidth="2.6" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="42" cy="52" r="2.6" fill="var(--terracotta-strong)" />
          <circle cx="55" cy="52" r="2.6" fill="var(--terracotta-strong)" />
          <path d="M42 59c2 3 10 3 12 0" stroke="var(--terracotta-strong)" strokeWidth="2.6" strokeLinecap="round" />
        </>
      )}
      {/* base */}
      <path d="M34 74h28l-4 8H38z" fill="var(--terracotta)" />
    </svg>
  );
}
