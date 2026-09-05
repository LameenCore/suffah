import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { env } from "@/lib/env";
import { DemoResetButton } from "@/components/DemoResetButton";

const ROLE_LABEL: Record<SessionUser["role"], string> = {
  admin: "Masjid Admin",
  parent: "Parent",
  student: "Playground",
};

const ROLE_ACCENT: Record<SessionUser["role"], string> = {
  admin: "bg-emerald-600",
  parent: "bg-sky-600",
  student: "bg-violet-600",
};

/** Shared shell for all three dashboards - header, role badge, dev role switch. */
export function DashboardChrome({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3 dark:border-white/10 dark:bg-zinc-950">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Suffa
          </Link>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium text-white ${ROLE_ACCENT[user.role]}`}
          >
            {ROLE_LABEL[user.role]}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
          {env.demoMode && user.role === "admin" && <DemoResetButton />}
          <span>{user.name}</span>
          <Link href="/" className="underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200">
            switch role
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
