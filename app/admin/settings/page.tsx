import { requireRole } from "@/lib/auth";
import { getServiceClient } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { LOCALES, DEFAULT_LOCALE, isLocale } from "@/lib/i18n/config";
import { setMasjidDefaultLocaleAction } from "@/app/admin/settings/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default async function AdminSettingsPage({
  searchParams,
}: PageProps<"/admin/settings">) {
  const user = await requireRole("admin");
  const { t } = await getT(user);
  const sp = await searchParams;
  const saved = sp.saved === "1";

  const { data: masjid } = await getServiceClient()
    .from("masjids")
    .select("default_locale")
    .eq("id", user.masjidId)
    .maybeSingle();
  const current = isLocale(masjid?.default_locale)
    ? (masjid!.default_locale as string)
    : DEFAULT_LOCALE;

  const optionLabel: Record<string, string> = {
    en: t("admin.settings.optionEn"),
    fr: t("admin.settings.optionFr"),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("admin.settings.kicker")}
        title={t("admin.settings.title")}
        lede={t("admin.settings.lede")}
        back={{ href: "/admin", label: t("admin.settings.back") }}
      />

      <Card as="section" className="max-w-lg space-y-4 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {t("admin.settings.defaultLocaleTitle")}
          </h2>
          <p className="mt-1 text-sm text-ink-3">
            {t("admin.settings.defaultLocaleLede")}
          </p>
        </div>

        <form action={setMasjidDefaultLocaleAction} className="space-y-3">
          <fieldset className="space-y-2">
            {LOCALES.map((loc) => (
              <label
                key={loc}
                className="flex cursor-pointer items-center gap-2.5 rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm has-[:checked]:border-terracotta has-[:checked]:bg-terracotta-soft"
              >
                <input
                  type="radio"
                  name="locale"
                  value={loc}
                  defaultChecked={loc === current}
                  className="accent-[color:var(--terracotta)]"
                />
                <span className="text-ink-2">{optionLabel[loc]}</span>
              </label>
            ))}
          </fieldset>
          <Button type="submit" size="sm">
            {t("admin.settings.save")}
          </Button>
          {saved ? (
            <p role="status" className="text-xs text-success">
              {t("admin.settings.defaultLocaleSaved")}
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
