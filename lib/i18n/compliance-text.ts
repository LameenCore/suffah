// Locale-aware restatement of the compliance status engine's English output
// (T59). `lib/compliance/status.ts` stays pure and English so its unit tests are
// unaffected; every view that shows a report runs its `level` / `counts` /
// `signalCodes` back through the active translator here.

import type { MessageKey, Translator } from "@/lib/i18n";
import type {
  ComplianceLevel,
  OverallCompliance,
  SignalCode,
} from "@/lib/compliance/status";

/** "On track" / "Watch" / "Gap forming" in the active locale. */
export function levelLabel(t: Translator, level: ComplianceLevel): string {
  return t(`compliance.level.${level}` as MessageKey);
}

/** Restatement of `computeOverall`'s headline from level + counts. */
export function overallHeadline(t: Translator, o: OverallCompliance): string {
  if (o.level === "gap") {
    return t(
      o.counts.gap === 1 ? "compliance.overallGapOne" : "compliance.overallGapMany",
      { n: o.counts.gap },
    );
  }
  if (o.level === "watch") {
    return t(
      o.counts.watch === 1
        ? "compliance.overallWatchOne"
        : "compliance.overallWatchMany",
      { n: o.counts.watch },
    );
  }
  return t("compliance.overallOnTrack");
}

/** One localised course signal from its structured code + params. */
export function signalText(t: Translator, s: SignalCode): string {
  return t(`compliance.signal.${s.code}` as MessageKey, s.params);
}
