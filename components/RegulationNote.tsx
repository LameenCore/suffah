// Hard constraint from PRD §8 / CLAUDE.md: any legal/compliance-adjacent copy
// (exemption thresholds, evaluation formats, exam equivalency) must carry a
// visible "verify with current regulation" note. Not optional polish.

export function RegulationNote({ children }: { children?: React.ReactNode }) {
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
      <span className="font-semibold">Verify with current regulation. </span>
      {children ??
        "Compliance thresholds and evaluation formats shown here are illustrative and must be confirmed against current Quebec home-instruction rules."}
    </p>
  );
}
