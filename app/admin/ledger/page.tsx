import { requireRole } from "@/lib/auth";
import { getT, type MessageKey } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { LedgerChart } from "@/components/admin/LedgerChart";
import { WaqfFlowDiagram } from "@/components/admin/WaqfFlowDiagram";
import { SponsoredOutcomes } from "@/components/admin/SponsoredOutcomes";
import {
  getFamilyFeeStatus,
  getLedgerSummary,
  type FamilyFeeRow,
  type LedgerEntry,
  type LedgerSummary,
} from "@/lib/db/ledger-queries";
import {
  getSponsoredOutcomes,
  type SponsoredOutcome,
} from "@/lib/db/sponsorship-queries";

const money = (v: number, intlLocale: string) =>
  v.toLocaleString(intlLocale, { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

const ENTRY_KEY: Record<LedgerEntry["entryType"], MessageKey> = {
  principal_deposit: "admin.ledger.entryPrincipalDeposit",
  return_disbursed: "admin.ledger.entryReturnDisbursed",
  sadaqah_received: "admin.ledger.entrySadaqahReceived",
  scholarship_allocated: "admin.ledger.entryScholarshipAllocated",
};

const FEE_KEY: Record<FamilyFeeRow["status"], MessageKey> = {
  fee_paid: "admin.ledger.feePaid",
  scholarship_covered: "admin.ledger.feeScholarship",
};

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-4">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-ink-4">{sub}</div>
    </div>
  );
}

export default async function AdminLedgerPage() {
  const user = await requireRole("admin");
  const { t, intlLocale } = await getT(user);
  const fmt = (v: number) => money(v, intlLocale);

  let summary: LedgerSummary | null = null;
  let fees: FamilyFeeRow[] = [];
  let sponsored: SponsoredOutcome[] = [];
  let loadError: string | null = null;

  try {
    [summary, fees, sponsored] = await Promise.all([
      getLedgerSummary(user.masjidId),
      getFamilyFeeStatus(user.masjidId),
      getSponsoredOutcomes(user.masjidId),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "unknown error";
  }

  const feePaid = fees.filter((f) => f.status === "fee_paid").length;
  const scholarship = fees.filter((f) => f.status === "scholarship_covered").length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("admin.ledger.kicker")}
        title={t("admin.ledger.title")}
        lede={t("admin.ledger.lede")}
        back={{ href: "/admin", label: t("nav.overview") }}
      />

      <p className="rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-xs text-ink-3">
        <span className="font-semibold text-ink">{t("admin.ledger.mockData")}</span>{" "}
        {t("admin.ledger.mockDataRest")}
      </p>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("admin.ledger.unavailable", { error: loadError })} <code>npm run seed</code>
        </Card>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label={t("admin.ledger.tilePrincipal")}
              value={fmt(summary.principal)}
              sub={t("admin.ledger.tilePrincipalSub")}
              accent="text-ink"
            />
            <StatTile
              label={t("admin.ledger.tileReturns")}
              value={fmt(summary.returnsDisbursed)}
              sub={t("admin.ledger.tileReturnsSub")}
              accent="text-teal-strong"
            />
            <StatTile
              label={t("admin.ledger.tileSadaqah")}
              value={fmt(summary.sadaqahReceived)}
              sub={t("admin.ledger.tileSadaqahSub")}
              accent="text-teal-strong"
            />
            <StatTile
              label={t("admin.ledger.tileScholarships")}
              value={fmt(summary.scholarshipsAllocated)}
              sub={t("admin.ledger.tileScholarshipsSub", { n: scholarship })}
              accent="text-terracotta"
            />
          </div>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-semibold text-ink">
              {t("admin.ledger.howItWorks")}
            </h2>
            <p className="mt-1 text-xs text-ink-3 ">{t("admin.ledger.howItWorksSub")}</p>
            <div className="mt-3">
              <WaqfFlowDiagram
                principal={summary.principal}
                returnsDisbursed={summary.returnsDisbursed}
                sadaqahReceived={summary.sadaqahReceived}
                scholarshipsAllocated={summary.scholarshipsAllocated}
                t={t}
                intlLocale={intlLocale}
              />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-semibold text-ink">
              {t("admin.ledger.sponsoredOutcomes")}
            </h2>
            <p className="mt-1 text-xs text-ink-3 ">{t("admin.ledger.sponsoredOutcomesSub")}</p>
            <div className="mt-3">
              <SponsoredOutcomes outcomes={sponsored} t={t} intlLocale={intlLocale} />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-semibold text-ink">
              {t("admin.ledger.spendVsPrincipal")}
            </h2>
            <p className="mt-1 text-xs text-ink-3 ">{t("admin.ledger.spendVsPrincipalSub")}</p>
            <div className="mt-3">
              <LedgerChart series={summary.spendSeries} principal={summary.principal} />
            </div>

            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-ink-3 hover:text-ink  ">
                {t("admin.ledger.tableToggle")}
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[32rem] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-4">
                      <th className="border-b border-border py-2 pr-4 ">{t("admin.ledger.colDate")}</th>
                      <th className="border-b border-border py-2 pr-4 ">{t("admin.ledger.colType")}</th>
                      <th className="border-b border-border py-2 pr-4 text-right ">{t("admin.ledger.colAmount")}</th>
                      <th className="border-b border-border py-2 ">{t("admin.ledger.colNote")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.entries.map((e, i) => (
                      <tr key={i}>
                        <td className="border-b border-border py-2 pr-4 tabular-nums text-ink-3  ">
                          {new Date(e.createdAt).toLocaleDateString(intlLocale, {
                            year: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="border-b border-border py-2 pr-4 ">
                          {t(ENTRY_KEY[e.entryType])}
                        </td>
                        <td
                          className={`border-b border-border py-2 pr-4 text-right tabular-nums  ${
                            e.amount < 0
                              ? "text-ink-3 "
                              : "text-teal-strong "
                          }`}
                        >
                          {fmt(e.amount)}
                        </td>
                        <td className="border-b border-border py-2 text-ink-3  ">
                          {e.note ?? "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">
                {t("admin.ledger.familyFeeStatus")}
              </h2>
              <span className="text-xs text-ink-3 ">
                {t("admin.ledger.feeStatusCount", { paid: feePaid, scholarship })}
              </span>
            </div>
            <ul className="mt-2 divide-y divide-border">
              {fees.map((f) => (
                <li
                  key={f.studentUserId}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>{f.studentName}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      f.status === "fee_paid"
                        ? "bg-surface-2 text-ink-2  "
                        : "bg-terracotta-soft text-terracotta-strong"
                    }`}
                  >
                    {t(FEE_KEY[f.status])}
                  </span>
                </li>
              ))}
              {fees.length === 0 && (
                <li className="py-2 text-sm text-ink-4">{t("admin.ledger.noFamilies")}</li>
              )}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
