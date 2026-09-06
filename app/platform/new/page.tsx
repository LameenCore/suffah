import { requirePlatformAdmin } from "@/lib/platform/auth";
import { getT } from "@/lib/i18n";
import { provisionMasjidAction } from "@/app/platform/new/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Provision a masjid" };

export default async function ProvisionMasjidPage({
  searchParams,
}: PageProps<"/platform/new">) {
  const user = await requirePlatformAdmin();
  const { t } = await getT(user);
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

  const field =
    "mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal";

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        kicker={t("platform.kicker")}
        title={t("platform.provisionTitle")}
        lede={t("platform.provisionLede")}
        back={{ href: "/platform", label: t("platform.title") }}
      />

      {error ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {error}
        </Card>
      ) : null}

      <Card className="p-5">
        <form action={provisionMasjidAction} className="space-y-4">
          <label className="block text-sm">
            <span className="text-ink-2">{t("platform.fieldMasjidName")}</span>
            <input name="name" required className={field} />
          </label>

          <label className="block text-sm">
            <span className="text-ink-2">{t("platform.fieldDefaultLocale")}</span>
            <select name="defaultLocale" defaultValue="fr" className={field}>
              <option value="fr">Français (Québec)</option>
              <option value="en">English</option>
            </select>
          </label>

          <fieldset className="space-y-3 rounded-[var(--radius)] border border-border p-3">
            <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-4">
              {t("platform.firstAdmin")}
            </legend>
            <label className="block text-sm">
              <span className="text-ink-2">{t("platform.fieldAdminName")}</span>
              <input name="adminName" required autoComplete="off" className={field} />
            </label>
            <label className="block text-sm">
              <span className="text-ink-2">{t("platform.fieldAdminEmail")}</span>
              <input name="adminEmail" type="email" required autoComplete="off" className={field} />
            </label>
            <label className="block text-sm">
              <span className="text-ink-2">{t("platform.fieldAdminPassword")}</span>
              <input
                name="adminPassword"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className={field}
              />
              <span className="mt-1 block text-[11px] text-ink-4">
                {t("platform.passwordHint")}
              </span>
            </label>
          </fieldset>

          <button
            type="submit"
            className="w-full rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
          >
            {t("platform.provisionSubmit")}
          </button>
          <p className="text-xs text-ink-4">{t("platform.provisionNote")}</p>
        </form>
      </Card>
    </div>
  );
}
