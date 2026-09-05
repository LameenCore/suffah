import { StubSection } from "@/components/StubSection";
import { COURSE_NAMES } from "@/lib/types";

export default function ParentHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parent Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Read-only view of your child&apos;s progress. No lesson management, no grading.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StubSection
          title="Progress by course"
          phase="Phase 4"
          items={COURSE_NAMES.map((c) => `${c} — pathway + progress bar`)}
        />
        <StubSection
          title="Report card"
          phase="Phase 4"
          items={["Checkpoint results (pass / needs review)", "Unit assessment scores", "Term exam scores"]}
        />
        <StubSection
          title="Pod schedule"
          phase="Phase 6"
          items={["Live session days / times", "Assigned volunteer"]}
        />
        <StubSection
          title="Fee / sponsorship"
          phase="Phase 5"
          items={["Flat fee paid", "or scholarship-covered"]}
        />
      </div>
    </div>
  );
}
