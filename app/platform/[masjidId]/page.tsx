import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/platform/auth";
import { getMasjidDetail } from "@/lib/platform/queries";
import { getT } from "@/lib/i18n";
import { setMasjidStatusAction } from "@/app/platform/[masjidId]/actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Masjid" };

const pct = (f: number) => `${Math.round(f * 100)}%`;
const usd = (v: number) =>
  v.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

export default async function PlatformMasjidPage({
  params,
  searchParams,
}: PageProps<"/platform/[masjidId]">) {
  const user = await requirePlatformAdmin();
  const { t } = await getT(user);
  const { masjidId } = await params;
  const sp = await searchParams;
  const justProvisioned = sp.provisioned === "1";

  const m = await getMasjidDetail(masjidId);
  if (!m) notFound();

  const stats: [string, string][] = [
    [t("platform.colStudents"), String(m.students)],
    [t("platform.colPods"), String(m.pods)],
    [t("platform.volunteersActive"), String(m.volunteersActive)],
    [t("platform.volunteersDeparted"), String(m.volunteersDeparted)],
    [t("platform.colChurn"), pct(m.churnRate)],
    [t("platform.colSpend"), usd(m.aiSpendMonthUsd)],
    [t("platform.waqfPrincipal"), usd(m.waqfPrincipalUsd)],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("platform.kicker")}
        title={m.name}
        back={{ href: "/platform", label: t("platform.title") }}
      />

      {justProvisioned ? (
        <Card tone="teal" className="p-4 text-sm text-ink-2">
          {t("platform.provisionedOk")}
        </Card>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {m.status === "suspended" ? (
          <Badge tone="danger">{t("platform.suspended")}</Badge>
        ) : (
          <Badge tone="success">{t("platform.active")}</Badge>
        )}
        <span className="text-sm text-ink-4">
          {t("platform.colLocale")}: <span className="uppercase">{m.defaultLocale}</span>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-4">{label}</p>
            <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
          </Card>
        ))}
      </div>

      <Card tone="warning" className="space-y-3 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          {m.status === "suspended" ? t("platform.reactivateTitle") : t("platform.suspendTitle")}
        </h2>
        <p className="text-sm text-ink-2">
          {m.status === "suspended" ? t("platform.reactivateBody") : t("platform.suspendBody")}
        </p>
        <form action={setMasjidStatusAction}>
          <input type="hidden" name="masjidId" value={m.id} />
          <input
            type="hidden"
            name="status"
            value={m.status === "suspended" ? "active" : "suspended"}
          />
          <button
            type="submit"
            className={`rounded-full px-4 py-2 text-sm font-medium text-white shadow-sm transition-[filter] hover:brightness-95 ${
              m.status === "suspended" ? "bg-teal" : "bg-danger"
            }`}
          >
            {m.status === "suspended"
              ? t("platform.reactivateSubmit")
              : t("platform.suspendSubmit")}
          </button>
        </form>
      </Card>
    </div>
  );
}
