"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/**
 * "Reset walkthrough" - re-runs the fast demo reset (no AI regeneration) via
 * POST /api/demo/reset. Rendered only for admins when NEXT_PUBLIC_SUFFA_DEMO_MODE
 * is on (see DashboardChrome). Lets a presenter reset between practice runs
 * without a terminal.
 */
export function DemoResetButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    setError(null);
    setDone(false);
    setBusy(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? `reset failed (${res.status})`);
      setDone(true);
      start(() => router.refresh());
      setTimeout(() => setDone(false), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="button"
        onClick={reset}
        disabled={busy || pending}
        className="rounded border border-amber-400 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-950/40"
        title="Re-seed the demo walkthrough state (no AI regeneration)"
      >
        {busy || pending ? "Resetting…" : done ? "Reset ✓" : "Reset walkthrough"}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </span>
  );
}
