// Classical test theory item statistics (T51). Pure - fed the graded attempts.

export interface AttemptItem {
  id: string;
  correct: boolean;
}

export interface GradedAttempt {
  /** 0..1 overall score for this attempt (used for the discrimination split). */
  score: number;
  perQuestion: AttemptItem[];
}

export type ItemFlag =
  | "ok"
  | "insufficient_data"
  | "too_hard"
  | "too_easy"
  | "negative_discrimination"
  | "weak_discrimination";

export interface ItemStats {
  questionId: string;
  /** Number of attempts that included this item. */
  n: number;
  /** p-value: fraction correct. Lower = harder. */
  pValue: number | null;
  /**
   * Discrimination index D = p(correct | top group) - p(correct | bottom group),
   * grouping attempts by overall score (upper/lower ~27%). Range -1..1.
   * Negative means the item is likely miskeyed or misleading.
   */
  discrimination: number | null;
  flag: ItemFlag;
}

const MIN_N = 8;
const GROUP_FRACTION = 0.27;

export function computeItemStats(attempts: GradedAttempt[]): ItemStats[] {
  // Collect per-question hit/miss keyed by question id, plus each attempt's score.
  const byQuestion = new Map<string, { correct: number; n: number }>();
  for (const a of attempts) {
    for (const item of a.perQuestion) {
      const cur = byQuestion.get(item.id) ?? { correct: 0, n: 0 };
      cur.n += 1;
      if (item.correct) cur.correct += 1;
      byQuestion.set(item.id, cur);
    }
  }

  // Discrimination: split attempts into upper/lower groups by score.
  const sorted = [...attempts].sort((x, y) => y.score - x.score);
  const groupSize = Math.max(1, Math.floor(sorted.length * GROUP_FRACTION));
  const upper = sorted.slice(0, groupSize);
  const lower = sorted.slice(-groupSize);

  const groupP = (group: GradedAttempt[], qid: string): number | null => {
    let hit = 0;
    let seen = 0;
    for (const a of group) {
      const item = a.perQuestion.find((i) => i.id === qid);
      if (!item) continue;
      seen += 1;
      if (item.correct) hit += 1;
    }
    return seen === 0 ? null : hit / seen;
  };

  const out: ItemStats[] = [];
  for (const [questionId, { correct, n }] of byQuestion) {
    const pValue = n === 0 ? null : correct / n;
    let discrimination: number | null = null;
    if (attempts.length >= MIN_N) {
      const pu = groupP(upper, questionId);
      const pl = groupP(lower, questionId);
      if (pu != null && pl != null) discrimination = Math.round((pu - pl) * 100) / 100;
    }

    let flag: ItemFlag = "ok";
    if (n < MIN_N) flag = "insufficient_data";
    else if (pValue != null && pValue < 0.15) flag = "too_hard";
    else if (pValue != null && pValue > 0.98) flag = "too_easy";
    else if (discrimination != null && discrimination < 0) flag = "negative_discrimination";
    else if (discrimination != null && discrimination < 0.1) flag = "weak_discrimination";

    out.push({
      questionId,
      n,
      pValue: pValue == null ? null : Math.round(pValue * 100) / 100,
      discrimination,
      flag,
    });
  }
  return out;
}

export function isProblemFlag(flag: ItemFlag): boolean {
  return flag === "too_hard" || flag === "negative_discrimination" || flag === "weak_discrimination";
}
