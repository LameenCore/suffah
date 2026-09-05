import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { LedgerChart } from "@/components/admin/LedgerChart";
import { WaqfFlowDiagram } from "@/components/admin/WaqfFlowDiagram";
import {
  getFamilyFeeStatus,
  getLedgerSummary,
  type FamilyFeeRow,
  type LedgerEntry,
  type LedgerSummary,
} from "@/lib/db/ledger-queries";

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
    <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>
    </div>
  );
}

export default async function AdminLedgerPage() {
  const user = await requireRole("admin");

  let summary: LedgerSummary | null = null;
  let fees: FamilyFeeRow[] = [];
  let loadError: string | null = null;

  try {
    [summary, fees] = await Promise.all([
      getLedgerSummary(user.masjidId),
      getFamilyFeeStatus(user.masjidId),
    ]);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load ledger data";
  }

  const feePaid = fees.filter((f) => f.status === "fee_paid").length;
  const scholarship = fees.filter((f) => f.status === "scholarship_covered").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/admin"
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Admin
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Waqf &amp; donation ledger</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Transparency view. The endowment principal is locked — only its returns,
          plus sadaqah, fund operations and scholarships.
        </p>
      </div>

      <p className="rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <span className="font-semibold">Illustrative mock data.</span> No payment
        processing — figures are seeded for the demo.
      </p>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          Ledger data is unavailable: {loadError}. Configure Supabase and run the
          seed to populate this view.
        </p>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile
              label="Principal — locked"
              value={money(summary.principal)}
              sub="Never spent. Only returns are drawn."
              accent="text-zinc-900 dark:text-zinc-100"
            />
            <StatTile
              label="Returns disbursed"
              value={money(summary.returnsDisbursed)}
              sub="Operating costs to date, from returns only."
              accent="text-sky-700 dark:text-sky-400"
            />
            <StatTile
              label="Sadaqah received"
              value={money(summary.sadaqahReceived)}
              sub="Community giving into the scholarship pool."
              accent="text-emerald-700 dark:text-emerald-400"
            />
            <StatTile
              label="Scholarships funded"
              value={money(summary.scholarshipsAllocated)}
              sub={`${scholarship} student${scholarship === 1 ? "" : "s"}, sadaqah-covered.`}
              accent="text-violet-700 dark:text-violet-400"
            />
          </div>

          <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
            <h2 className="font-medium">How the waqf works</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              The endowment model at a glance — for anyone new to waqf.
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

          <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
            <h2 className="font-medium">Spending vs. principal, over time</h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Cumulative operating draw and scholarships. The dashed line is the
              locked principal — spending never reaches it.
            </p>
            <div className="mt-3">
              <LedgerChart series={summary.spendSeries} principal={summary.principal} />
            </div>

            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200">
                Table view — all ledger entries
              </summary>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-zinc-400">
                      <th className="border-b border-black/10 py-2 pr-4 dark:border-white/15">Date</th>
                      <th className="border-b border-black/10 py-2 pr-4 dark:border-white/15">Type</th>
                      <th className="border-b border-black/10 py-2 pr-4 text-right dark:border-white/15">Amount</th>
                      <th className="border-b border-black/10 py-2 dark:border-white/15">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.entries.map((e, i) => (
                      <tr key={i}>
                        <td className="border-b border-black/5 py-2 pr-4 tabular-nums text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                          {new Date(e.createdAt).toLocaleDateString("en-CA", {
                            year: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="border-b border-black/5 py-2 pr-4 dark:border-white/10">
                          {ENTRY_LABEL[e.entryType]}
                        </td>
                        <td
                          className={`border-b border-black/5 py-2 pr-4 text-right tabular-nums dark:border-white/10 ${
                            e.amount < 0
                              ? "text-zinc-500 dark:text-zinc-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {money(e.amount)}
                        </td>
                        <td className="border-b border-black/5 py-2 text-zinc-500 dark:border-white/10 dark:text-zinc-400">
                          {e.note ?? "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <section className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-zinc-950">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Family fee status</h2>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {feePaid} paying · {scholarship} scholarship-covered
              </span>
            </div>
            <ul className="mt-2 divide-y divide-black/5 dark:divide-white/10">
              {fees.map((f) => (
                <li
                  key={f.studentUserId}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span>{f.studentName}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      f.status === "fee_paid"
                        ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                        : "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    }`}
                  >
                    {FEE_LABEL[f.status]}
                  </span>
                </li>
              ))}
              {fees.length === 0 && (
                <li className="py-2 text-sm text-zinc-400">No families on file.</li>
              )}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
