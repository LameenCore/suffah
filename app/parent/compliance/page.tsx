import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { getChildrenForParent } from "@/lib/db/parent-queries";
import { assembleComplianceReport } from "@/lib/compliance/report";
import { getTutorTranscript } from "@/lib/ai/tutor";
import { ComplianceReportView } from "@/components/compliance/ComplianceReportView";
import { TutorTranscriptView } from "@/components/student/TutorTranscriptView";
import { RegulationNote } from "@/components/RegulationNote";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";

export default async function ParentCompliancePage({
  searchParams,
}: PageProps<"/parent/compliance">) {
  const user = await requireRole("parent");
  const { t, intlLocale } = await getT(user);
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
  const tutorTranscripts = selected
    ? await getTutorTranscript(selected.id, user.masjidId).catch(() => [])
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={t("compliance.parentKicker")}
        title={t("compliance.parentTitle")}
        lede={t("compliance.parentLede")}
        back={{ href: "/parent", label: t("compliance.parentBack") }}
      />

      <RegulationNote>{t("compliance.parentRegulationNote")}</RegulationNote>

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {t("compliance.parentLoadError", { detail: loadError })}
        </Card>
      ) : children.length === 0 ? (
        <Card className="p-6 text-sm text-ink-3">{t("compliance.parentNoChildren")}</Card>
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
          {report ? (
            <ComplianceReportView report={report} t={t} intlLocale={intlLocale} />
          ) : null}
          {selected ? (
            <TutorTranscriptView
              transcripts={tutorTranscripts}
              t={t}
              intlLocale={intlLocale}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
