import Link from "next/link";
import { getT } from "@/lib/i18n";
import { Star8 } from "@/components/ui/Motif";

export const metadata = { title: "Offline" };

// Shown by the service worker when a navigation fails with no cached copy.
export default async function OfflinePage() {
  const { t } = await getT();
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
      <div
        className="geo-field pointer-events-none absolute inset-x-0 top-0 h-72 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-center gap-2">
          <Star8 className="h-5 w-5 text-terracotta" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
            Suffa
          </span>
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">{t("offline.title")}</h1>
        <p className="text-sm text-ink-3">{t("offline.body")}</p>
        <p className="text-xs text-ink-4">{t("offline.hint")}</p>
        <Link
          href="/student"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal px-5 text-sm font-medium text-white transition-colors hover:bg-teal-strong"
        >
          {t("offline.retry")}
        </Link>
      </div>
    </div>
  );
}
