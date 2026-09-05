import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getChildrenForParent } from "@/lib/db/parent-queries";
import { assembleComplianceReport } from "@/lib/compliance/report";
import { ComplianceReportView } from "@/components/compliance/ComplianceReportView";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

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
      <PageHeader
        kicker="Evaluation"
        title="Where things stand for the term"
        lede="A live read on your child against the term's evaluation requirement, updated as they work, so there are no surprises at term-end."
        back={{ href: "/parent", label: "This week" }}
      />

      <RegulationNote>
        This status is a planning aid. The official evaluation requirement, its format, and
        acceptable evidence must be confirmed with the masjid and against current Quebec
        home-instruction regulation.
      </RegulationNote>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}.
        </Card>
      ) : children.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">No children linked to this account yet.</Card>
      ) : (
        <>
          {children.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {children.map((c) => (
                <Link
                  key={c.id}
                  href={`/parent/compliance?child=${c.id}`}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    selected?.id === c.id
                      ? "border-terracotta bg-terracotta-soft font-medium text-terracotta-strong"
                      : "border-border text-ink-3 hover:border-border-strong"
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
