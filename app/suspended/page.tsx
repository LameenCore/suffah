import { getT } from "@/lib/i18n";
import { Star8 } from "@/components/ui/Motif";

export const metadata = { title: "Account paused" };

export default async function SuspendedPage() {
  const { t } = await getT();
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-center gap-2">
          <Star8 className="h-4 w-4 text-terracotta" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
            Suffa
          </span>
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">{t("suspended.title")}</h1>
        <p className="text-sm text-ink-3">{t("suspended.body")}</p>
      </div>
    </div>
  );
}
