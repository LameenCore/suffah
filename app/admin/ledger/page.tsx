import { requireRole } from "@/lib/auth";
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

const money = (v: number) =>
  v.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

const ENTRY_LABEL: Record<LedgerEntry["entryType"], string> = {
  principal_deposit: "Principal deposit",
  return_disbursed: "Return disbursed",
  sadaqah_received: "Sadaqah received",
  scholarship_allocated: "Scholarship allocated",
};

const FEE_LABEL: Record<FamilyFeeRow["status"], string> = {
  fee_paid: "Flat fee paid",
  scholarship_covered: "Scholarship-covered",
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
    loadError = err instanceof Error ? err.message : "could not load ledger data";
  }

  const feePaid = fees.filter((f) => f.status === "fee_paid").length;
  const scholarship = fees.filter((f) => f.status === "scholarship_covered").length;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Waqf & donation ledger"
        title="Where the money sits, and moves"
        lede="Transparency view. The endowment principal is locked - only its returns, plus sadaqah, fund operations and scholarships."
        back={{ href: "/admin", label: "Overview" }}
      />

      <p className="rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2 text-xs text-ink-3">
        <span className="font-semibold text-ink">Illustrative mock data.</span> No payment
        processing - figures are seeded for the demo.
      </p>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          Ledger data is unavailable: {loadError}. Run <code>npm run seed</code>.
        </Card>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Principal - locked"
              value={money(summary.principal)}
              sub="Never spent. Only returns are drawn."
              accent="text-ink"
            />
            <StatTile
              label="Returns disbursed"
              value={money(summary.returnsDisbursed)}
              sub="Operating costs to date, from returns only."
              accent="text-teal-strong"
            />
            <StatTile
              label="Sadaqah received"
              value={money(summary.sadaqahReceived)}
              sub="Community giving into the scholarship pool."
              accent="text-teal-strong"
            />
            <StatTile
              label="Scholarships funded"
              value={money(summary.scholarshipsAllocated)}
              sub={`${scholarship} student${scholarship === 1 ? "" : "s"}, sadaqah-covered.`}
              accent="text-terracotta"
            />
          </div>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-semibold text-ink">How the waqf works</h2>
            <p className="mt-1 text-xs text-ink-3 ">
              The endowment model at a glance - for anyone new to waqf.
            </p>
            <div className="mt-3">
              <WaqfFlowDiagram
                principal={summary.principal}
                returnsDisbursed={summary.returnsDisbursed}
                sadaqahReceived={summary.sadaqahReceived}
                scholarshipsAllocated={summary.scholarshipsAllocated}
              />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-semibold text-ink">Sponsored outcomes</h2>
            <p className="mt-1 text-xs text-ink-3 ">
              What each contribution funded - and what the sponsored pod actually
              learned. Not just where the money went.
            </p>
            <div className="mt-3">
              <SponsoredOutcomes outcomes={sponsored} />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="font-display text-lg font-semibold text-ink">Spending vs. principal, over time</h2>
            <p className="mt-1 text-xs text-ink-3 ">
              Cumulative operating draw and scholarships. The dashed line is the
              locked principal - spending never reaches it.
            </p>
            <div className="mt-3">
              <LedgerChart series={summary.spendSeries} principal={summary.principal} />
            </div>

            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-ink-3 hover:text-ink  ">
                Table view - all ledger entries
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-ink-4">
                      <th className="border-b border-border py-2 pr-4 ">Date</th>
                      <th className="border-b border-border py-2 pr-4 ">Type</th>
                      <th className="border-b border-border py-2 pr-4 text-right ">Amount</th>
                      <th className="border-b border-border py-2 ">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.entries.map((e, i) => (
                      <tr key={i}>
                        <td className="border-b border-border py-2 pr-4 tabular-nums text-ink-3  ">
                          {new Date(e.createdAt).toLocaleDateString("en-CA", {
                            year: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="border-b border-border py-2 pr-4 ">
                          {ENTRY_LABEL[e.entryType]}
                        </td>
                        <td
                          className={`border-b border-border py-2 pr-4 text-right tabular-nums  ${
                            e.amount < 0
                              ? "text-ink-3 "
                              : "text-teal-strong "
                          }`}
                        >
                          {money(e.amount)}
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
              <h2 className="font-display text-lg font-semibold text-ink">Family fee status</h2>
              <span className="text-xs text-ink-3 ">
                {feePaid} paying · {scholarship} scholarship-covered
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
                    {FEE_LABEL[f.status]}
                  </span>
                </li>
              ))}
              {fees.length === 0 && (
                <li className="py-2 text-sm text-ink-4">No families on file.</li>
              )}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
