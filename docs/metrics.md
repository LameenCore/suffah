# Core metrics — definitions & instrumentation

_Task T65. The metric set the masjid and the mission steer by. Surfaced as the
**Mission health** band on `/admin/analytics` and in that page's CSV export
(`getMissionHealth` / `getLearningAnalytics` in `lib/db/analytics-queries.ts`)._

## Instrumentation stance

**No event pipeline. No third-party analytics. No tracker.** Every metric here is
**derived on read from operational database state** — the same rows the app
already writes for its features (`checkpoint_results`, `users.created_at`,
`volunteers.left_at`, `waqf_ledger`, `model_call_log`). This is a deliberate
choice for a product used by minors (see `docs/data-map.md`): there is nothing to
opt out of because nothing is collected beyond what running the service requires.

The cost is that **history is not retained** — every number is "as of now". A time
series (e.g. "at-risk count over the term") needs a small periodic job writing an
aggregate `analytics_snapshots` row (no per-student data). That job is the one
open follow-on; it can build on the compliance "living document" (T20).

## The seven metrics

| Metric | Definition | Source | Cadence | Target / guardrail |
|---|---|---|---|---|
| **Completion rate** | Mean over courses of `students who have passed a checkpoint at every node ÷ enrolled students`. Per-course figure also shown with a drop-off histogram. | `checkpoint_results` (passed), `pathway_nodes` count, `users` (role=student) | live | trend up term over term; a course stuck near 0 late in the term is a content or pacing problem |
| **Time to value** | Median days from `users.created_at` to a student's **first passed checkpoint**. Students with no passed checkpoint are excluded from the median (and show up in retention instead). | `users.created_at`, `checkpoint_results` (passed, earliest per student) | live | ≤ ~7 days; a rising number means onboarding or the first lesson is too heavy |
| **Family retention (30d)** | Share of enrolled students with **any checkpoint attempt in the last 30 days**. Proxy for "families still actively using Suffa". | `checkpoint_results.attempted_at` | live | ≥ 0.7 during a term; a drop is the earliest churn signal |
| **At-risk count** | Students whose overall compliance level is `watch` or `gap`, from the **same engine families see** (`assembleFromChildReport` → `computeOverall`). Shown as a count and a share of all students. | compliance status engine over `getChildReports` | live | as low as possible; every at-risk student should map to a named follow-up |
| **Volunteer churn rate** | `departed ÷ (active + departed)` volunteers, all-time. Also reported: departures in the last 90 days. | `volunteers.left_at` | live | context for continuity load; a spike in 90-day departures means the Continuity Fingerprint (T18) is about to be exercised hard |
| **AI cost per active student** | This calendar month's model spend ÷ students active this term. `null` when there are no active students. | `model_call_log.cost_usd` (month to date) via `getMonthSpend`, `studentsActive` | live (month-to-date) | should stay well under the flat family fee; the funding model assumes ~one-time generation per unit (see `docs/cost-model.md`) |
| **Waqf runway** | `(principal × 4% annual draw + sadaqah received) ÷ (returns disbursed + scholarships allocated)`, in years. Rough, **illustrative** — the ledger is mock data (T13/T14) and 4% is an assumption. | `waqf_ledger` entry-type sums | live | > 1.0 with margin; < 1.0 means committed outflow exceeds the sustainable draw |

## Notes on each formula

- **Completion / drop-off** use *furthest checkpoint passed* (distinct node titles)
  as the per-student position, because that is the only per-student signal
  `getChildReports` exposes without an extra query. A student who attempted but
  did not pass a node counts as still at the previous position — intentional: the
  metric tracks mastery, not clicks.
- **At-risk** is defined once, in `lib/compliance/status.ts`, and reused here so
  the admin number can never drift from what a family is told. Its thresholds are
  illustrative and flagged as "verify with current regulation" in the UI.
- **AI $/active** is month-to-date, so it is low early in the month. Compare
  across whole months, and against `docs/cost-model.md`.
- **Waqf runway** is planning-only. When the ledger stops being mock data, revisit
  the 4% assumption and the "committed outflow" definition with real numbers.

## Where it shows up

- **`/admin/analytics`** — the "Mission health" band (all seven) plus the
  supporting detail: per-course completion + drop-off bars, pod cohorts,
  volunteer and waqf breakdown.
- **`/admin/analytics/export`** — CSV with a `mission_health` section and the full
  course/cohort detail.
- **`/admin/ai-spend`** (T56) — the spend side of "AI cost per active student" in
  detail, with the per-masjid budget and hard cap.
