import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getChildrenForParent } from "@/lib/db/parent-queries";
import { assembleComplianceReport } from "@/lib/compliance/report";
import { ComplianceReportView } from "@/components/compliance/ComplianceReportView";
import { RegulationNote } from "@/components/RegulationNote";

export default async function ParentCompliancePage({
  searchParams,
}: PageProps<"/parent/compliance">) {
  const user = await requireRole("parent");
  const sp = await searchParams;
  const selectedId = typeof sp.child === "string" ? sp.child : null;

  let children: Awaited<ReturnType<typeof getChildrenForParent>> = [];
  let loadError: string | null = null;
  try {
    children = await getChildrenForParent(user.id, user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load children";
  }

  const selected = children.find((c) => c.id === selectedId) ?? children[0] ?? null;
  const report = selected
    ? await assembleComplianceReport(selected.id, selected.name, user.masjidId)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/parent"
          className="text-zinc-500 underline underline-offset-2 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← Dashboard
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Evaluation status</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          A live read on where your child stands against the term&apos;s evaluation
          requirement - updated as they work, so there are no surprises at term-end.
        </p>
      </div>

      <RegulationNote>
        This status is a planning aid. The official evaluation requirement, its format, and
        acceptable evidence must be confirmed with the masjid and against current Québec
        home-instruction regulation.
      </RegulationNote>

      {loadError ? (
        <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
          {loadError}.
        </p>
      ) : children.length === 0 ? (
        <p className="rounded-xl border border-black/10 p-6 text-sm text-zinc-500 dark:border-white/15">
          No children linked to this account yet.
        </p>
      ) : (
        <>
          {children.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <Link
                  key={c.id}
                  href={`/parent/compliance?child=${c.id}`}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    selected?.id === c.id
                      ? "border-sky-400 bg-sky-50 font-medium text-sky-800 dark:border-sky-500 dark:bg-sky-950/40 dark:text-sky-200"
                      : "border-black/10 text-zinc-600 dark:border-white/15 dark:text-zinc-300"
                  }`}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          ) : null}
          {report ? <ComplianceReportView report={report} /> : null}
        </>
      )}
    </div>
  );
}
