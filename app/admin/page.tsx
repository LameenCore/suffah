import { RegulationNote } from "@/components/RegulationNote";
import { StubSection } from "@/components/StubSection";

export default function AdminHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Masjid Admin</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Administer pods, volunteers, compliance reporting, and the waqf ledger.
        </p>
      </div>

      <RegulationNote>
        Pod size caps and report formats below follow Quebec&apos;s home-instruction
        exemption as currently understood — confirm against active regulation before
        relying on them.
      </RegulationNote>

      <div className="grid gap-4 sm:grid-cols-2">
        <StubSection
          title="Volunteers"
          phase="Phase 6"
          items={["Onboarding form", "Certification / vetting status", "Churn log"]}
        />
        <StubSection
          title="Pods"
          phase="Phase 4"
          items={["Create pod (max 4 students)", "Assign volunteer + students", "Continuity handoff view"]}
        />
        <StubSection
          title="Compliance reports"
          phase="Phase 4"
          items={["Aggregate checkpoint + unit + exam data", "Export per student / pod"]}
        />
        <StubSection
          title="Waqf & donation ledger"
          phase="Phase 5"
          items={["Principal balance (locked)", "Return disbursed over time", "Sadaqah / scholarships"]}
        />
      </div>
    </div>
  );
}
