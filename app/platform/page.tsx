import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { getPlatformOverview } from "@/lib/platform/queries";
import { countPendingApplications } from "@/lib/platform/applications";
import { getT } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export const metadata = { title: "Platform" };

const pct = (f: number) => `${Math.round(f * 100)}%`;
const usd = (v: number) =>
  v.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

export default async function PlatformHome() {
  const user = await requirePlatformAdmin();
  const { t, intlLocale } = await getT(user);

  let rows: Awaited<ReturnType<typeof getPlatformOverview>> = [];
  let loadError: string | null = null;
  let pendingApps = 0;
  try {
    [rows, pendingApps] = await Promise.all([
      getPlatformOverview(),
      countPendingApplications().catch(() => 0),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load masjids";
  }

  const totalStudents = rows.reduce((s, r) => s + r.students, 0);
  const totalSpend = rows.reduce((s, r) => s + r.aiSpendMonthUsd, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("platform.kicker")}
        title={t("platform.title")}
        lede={t("platform.lede")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink href="/platform/applications" variant="ghost" size="sm">
              Applications{pendingApps > 0 ? ` (${pendingApps})` : ""}
            </ButtonLink>
            <ButtonLink href="/platform/new" variant="primary" size="sm">
              {t("platform.provisionCta")}
            </ButtonLink>
          </div>
        }
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">
                {t("platform.statMasjids")}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-ink">{rows.length}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">
                {t("platform.statStudents")}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-ink">{totalStudents}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">
                {t("platform.statSpend")}
              </p>
              <p className="mt-1 font-display text-2xl font-semibold text-ink">{usd(totalSpend)}</p>
            </Card>
          </div>

          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-4">
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colMasjid")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colStatus")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colLocale")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colStudents")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colPods")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colChurn")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colSpend")}</th>
                  <th className="px-4 py-2.5 font-semibold">{t("platform.colCreated")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">
                      <Link href={`/platform/${m.id}`} className="font-medium text-ink hover:text-teal">
                        {m.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      {m.status === "suspended" ? (
                        <Badge tone="danger">{t("platform.suspended")}</Badge>
                      ) : (
                        <Badge tone="success">{t("platform.active")}</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 uppercase text-ink-3">{m.defaultLocale}</td>
                    <td className="px-4 py-2.5 tabular-nums text-ink-2">{m.students}</td>
                    <td className="px-4 py-2.5 tabular-nums text-ink-2">{m.pods}</td>
                    <td className="px-4 py-2.5 tabular-nums text-ink-2">
                      {pct(m.churnRate)}{" "}
                      <span className="text-ink-4">
                        ({m.volunteersActive}/{m.volunteersActive + m.volunteersDeparted})
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-ink-2">{usd(m.aiSpendMonthUsd)}</td>
                    <td className="px-4 py-2.5 text-ink-4">
                      {m.createdAt
                        ? new Date(m.createdAt).toLocaleDateString(intlLocale, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-ink-4">
                      {t("platform.noMasjids")}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </Card>

          <p className="text-xs text-ink-4">{t("platform.noPiiNote")}</p>
        </>
      )}
    </div>
  );
}
