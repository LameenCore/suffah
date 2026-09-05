# Research: numbers behind the Suffa funding model

_Date: 2026-09-05 · Question: what real figures ground the waqf / fee / sadaqah
model and the "AI is cheap here" claim, for the pitch one-pager (T26)?_

## Answer (short)

The model is viable because instruction content is **generated once per curriculum
unit and persisted** (the repo enforces this) - so AI is a one-time ~$0.30 per
unit per masjid, not a per-student-per-lesson cost, and grading is deterministic
code (~$0). A conservatively-managed founding waqf (~4%/yr sustainable draw)
covers a masjid's near-zero-marginal-cost operation indefinitely; the flat fee
and sadaqah cover the buffer and scholarships. Quebec context: ~7,900
homeschoolers province-wide (0.8%, growing) and ~421,710 Muslims (2021 census),
concentrated in Greater Montreal.

## Findings

- **Quebec homeschoolers: ~7,900**, about **0.8%** of ~1.01M school-age children;
  the movement grew 2019-2024. Registration compliance is imperfect, so the true
  number is likely higher - Canadian Centre for Home Education, *State of the
  Homeschool Movement: Canada 2019-2024*.
- **Muslims in Quebec: 421,710** (**~5%** of the province), highly concentrated in
  Greater Montreal - 2021 Census, via Wikipedia *Islam in Canada* and secondary
  summaries.
- **Endowment sustainable spending: 4-5%**, and **<=4% preserves principal
  indefinitely** through downturns - 2024 NACUBO study, summarised by endowment
  spending-policy guides. Waqf-specific models distribute ~80% of income, reinvest
  10-20% - EverWaqf / waqf-fund.org. Sharia-compliant waqf portfolios cite ~7%
  average annual return (single source, treat as optimistic).
- **The defining waqf rule:** the principal is preserved forever - never consumed,
  distributed, or diminished; only the yield is spent - multiple waqf sources,
  consistent.
- **Claude Sonnet 5 API pricing** (the model the app uses): **$2.00 / 1M input,
  $10.00 / 1M output**; cache reads ~0.1x, cache writes ~1.25x - claude-api skill
  model table (cached 2026-06-24).
- **Derived - one-time content cost per curriculum unit (3 courses x
  lesson+checkpoint+assessment+exam ~= 12 model calls, ~30K input + ~24K output):**
  30K x $2/M + 24K x $10/M ~= **$0.30**, generated once and served statically to
  every student in every pod in that masjid. Adding a student to an existing pod
  costs ~nothing.
- **Derived - grading cost: ~$0.** `lib/ai/questions.ts` grades
  MCQ/numeric/short-answer deterministically in code; no model call.
- **Per-pod continuity briefing (T18): ~$0.02** (one call, ~3K in / ~1.5K out),
  only on a volunteer handoff - not per student.

## Open questions / contradictions

- The ~7% waqf return is a single promotional source; the pitch uses a
  conservative 4% draw so the number does not depend on it.
- Real per-masjid operating cost (hosting + a part-time community coordinator
  stipend) is an estimate, ~$6-10K/yr for a masjid running several pods - flagged
  as an assumption in the pitch, not a sourced figure.
- Content updates over a full school year add model calls beyond the one-time
  ~$0.30; still small (a few dollars per unit per year), but not zero.

## Sources

1. CCHE - *The State of the Homeschool Movement: Canada 2019-2024* - https://cche.ca/the-state-of-the-homeschool-movement-canada-2019-2024/ - accessed 2026-09-05
2. Wikipedia - *Islam in Canada* (2021 census figures) - https://en.wikipedia.org/wiki/Islam_in_Canada - accessed 2026-09-05
3. Endowment spending-policy guide (summarising NACUBO 2024) - https://plentifulwealth.com/spending-policy-for-endowments-a-comprehensive-guide/ - accessed 2026-09-05
4. EverWaqf Fund (AMCF) - https://amuslimcf.org/everwaqf-fund-a-permanent-waqf-for-eternal-good/ - accessed 2026-09-05
5. claude-api skill - model pricing table (cached 2026-06-24)
