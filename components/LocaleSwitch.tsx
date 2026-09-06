"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/lib/i18n/actions";
import { LOCALES, LOCALE_LABEL } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/client";

export function LocaleSwitch({ compact = false }: { compact?: boolean }) {
  const current = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();

  function choose(next: string) {
    if (next === current || pending) return;
    start(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 rounded-full border border-border bg-surface p-0.5 text-xs ${
        pending ? "opacity-60" : ""
      }`}
      role="group"
      aria-label="Language / Langue"
    >
      {LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          onClick={() => choose(loc)}
          aria-pressed={current === loc}
          className={`rounded-full px-2 py-0.5 font-medium transition-colors ${
            current === loc
              ? "bg-terracotta text-white"
              : "text-ink-3 hover:text-ink"
          }`}
        >
          {compact ? loc.toUpperCase() : LOCALE_LABEL[loc]}
        </button>
      ))}
    </div>
  );
}
