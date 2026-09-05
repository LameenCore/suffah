import { Star8 } from "@/components/ui/Motif";

// Hard constraint from PRD 8 / CLAUDE.md: any legal/compliance-adjacent copy
// (exemption thresholds, evaluation formats, exam equivalency) must carry a
// visible "verify with current regulation" note.

export function RegulationNote({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius)] border border-mustard/40 bg-mustard-soft px-4 py-3 text-xs leading-relaxed text-[color:var(--ink)]">
      <Star8 className="mt-0.5 h-4 w-4 shrink-0 text-mustard" />
      <p>
        <span className="font-semibold">Verify with current regulation. </span>
        {children ??
          "Compliance thresholds and evaluation formats shown here are illustrative and must be confirmed against current Quebec home-instruction rules."}
      </p>
    </div>
  );
}
