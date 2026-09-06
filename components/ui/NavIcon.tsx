import type { SVGProps } from "react";

type Name =
  | "home"
  | "grid"
  | "users"
  | "spark"
  | "swap"
  | "clipboard"
  | "coins"
  | "book"
  | "inbox"
  | "gauge"
  | "path"
  | "shield"
  | "check"
  | "chart"
  | "pencil"
  | "gear";

const PATHS: Record<Name, React.ReactNode> = {
  home: <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
  grid: <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 6M15.5 20a5.5 5.5 0 0 0-2.5-4.6" />
    </>
  ),
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />,
  swap: <path d="M7 7h11l-3-3M17 17H6l3 3" />,
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="17" rx="2" />
      <path d="M9 4V3h6v1M9 10h6M9 14h4" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="7" ry="3" />
      <path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5" />
    </>
  ),
  book: <path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zM5 19.5A1.5 1.5 0 0 0 6.5 21H19" />,
  inbox: <path d="M4 13V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8m-16 0 2.5 4h11L20 13M4 13h5a3 3 0 0 0 6 0h5" />,
  gauge: (
    <>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4-5" />
      <circle cx="12" cy="18" r="1.4" fill="currentColor" />
    </>
  ),
  path: <path d="M6 20c0-4 3-4 3-8s-3-4-3-8M12 4c0 4 3 4 3 8s-3 4-3 8M18 20V4" />,
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6zM9 12l2 2 4-4" />,
  check: <path d="M5 13l4 4L19 7" />,
  chart: <path d="M4 20V4M4 20h16M8 20v-6M13 20V9M18 20v-9" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>
  ),
};

export function NavIcon({
  name,
  className = "h-4 w-4",
  ...props
}: { name: Name } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
