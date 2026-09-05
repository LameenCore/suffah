import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { env } from "@/lib/env";
import { Star8 } from "@/components/ui/Motif";
import { SubNav, type NavItem } from "@/components/SubNav";
import { DemoResetButton } from "@/components/DemoResetButton";

const ROLE_LABEL: Record<SessionUser["role"], string> = {
  admin: "Masjid Admin",
  parent: "Family",
  student: "Playground",
};

const ROLE_TONE: Record<SessionUser["role"], string> = {
  admin: "bg-teal-soft text-teal-strong",
  parent: "bg-coral-soft text-terracotta-strong",
  student: "bg-mustard-soft text-[color:var(--ink)]",
};

/** Shared shell for all three dashboards: warm top bar + optional sub-nav. */
export function DashboardChrome({
  user,
  nav,
  wide = false,
  children,
}: {
  user: SessionUser;
  nav?: NavItem[];
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-bg">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <Link href="/" className="flex items-center gap-2">
              <Star8 className="h-6 w-6 text-terracotta" />
              <span className="font-display text-lg font-semibold text-ink">Suffa</span>
            </Link>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_TONE[user.role]}`}
            >
              {ROLE_LABEL[user.role]}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-3">
            {env.demoMode && user.role === "admin" ? <DemoResetButton /> : null}
            <span className="hidden sm:inline">{user.name}</span>
            <Link
              href="/"
              className="rounded-full border border-border px-3 py-1 text-xs text-ink-3 transition-colors hover:border-teal hover:text-teal"
            >
              switch role
            </Link>
          </div>
        </div>
        {nav && nav.length > 0 ? (
          <div className="mx-auto w-full max-w-6xl px-5">
            <SubNav items={nav} />
          </div>
        ) : null}
      </header>
      <main
        className={`mx-auto w-full flex-1 px-5 py-8 ${wide ? "max-w-6xl" : "max-w-4xl"}`}
      >
        {children}
      </main>
    </div>
  );
}
