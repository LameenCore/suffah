import { RegulationNote } from "@/components/RegulationNote";
import { StubSection } from "@/components/StubSection";
import { COURSE_NAMES } from "@/lib/types";

export default function StudentHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Playground</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Learn at your own pace. The AI teaches the lesson, then a checkpoint before
          you move on.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {COURSE_NAMES.map((course) => (
          <StubSection
            key={course}
            title={course}
            phase="Phase 2"
            items={["Pathway nodes", "AI lesson + practice", "Checkpoint to advance"]}
          />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StubSection
          title="Checkpoints"
          phase="Phase 2"
          items={["Per lesson node", "Immediate, low-stakes", "Remedial branch on fail"]}
        />
        <StubSection
          title="Unit assessments"
          phase="Phase 3"
          items={["Cumulative across nodes", "Marks topic mastery", "Feeds compliance report"]}
        />
        <StubSection
          title="Term exam"
          phase="Phase 3"
          items={["Timed", "No mid-exam remedial", "Primary compliance artifact"]}
        />
      </div>

      <RegulationNote>
        Assessment formats and exam equivalency shown here are for the demo and must
        be verified against current Quebec evaluation requirements.
      </RegulationNote>
    </div>
  );
}
