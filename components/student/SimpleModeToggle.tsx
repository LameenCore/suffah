"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";

/** Session toggle for T66 simple mode. Reads the current state from the
 *  data-simple attribute the server set on the chrome root. */
export function SimpleModeToggle() {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    const on =
      typeof document !== "undefined" &&
      document.querySelector("[data-simple]") != null;
    document.cookie = `suffa-simple=${on ? "0" : "1"}; path=/; max-age=31536000`;
    start(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="flex w-full items-center justify-between rounded-[var(--radius)] px-3 py-2 text-sm text-ink-2 hover:bg-surface-2 disabled:opacity-60"
    >
      <span>{t("simple.toggle")}</span>
      <span
        aria-hidden
        className="rounded-full border border-border px-1.5 py-0.5 text-[10px] uppercase text-ink-4"
      >
        {t("simple.toggleHint")}
      </span>
    </button>
  );
}
