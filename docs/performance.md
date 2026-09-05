# Performance - measured, and what we'd do at scale

_Last measured: 2026-09-05 (T73). Re-run the method below after any change to a
dashboard loader or a `lib/db/*` query._

Suffa's pages are all server-rendered on demand (`ƒ` in the build output) and the
work in each one is **Supabase round-trips**, not CPU or client JS. So "performance"
here means: how many queries does a page fire, and how long does the server take to
render it. The database is a hosted Supabase instance reached through the shared
pooler; every query pays a network round-trip, so cutting the query *count* is the
lever that matters.

## How this was measured

- `npm run build` then `npx next start -p 3100` (production build, not dev).
- DB: the demo Supabase project (`aws-0-us-west-2` pooler), seeded via
  `npm run demo:setup`.
- 7 requests per route with the right role cookie, warm server, median reported:
  `curl -s -o /dev/null -w "%{time_total}" -H "Cookie: suffa-dev-role=<role>" ...`
- Server-side render time dominates; localhost transport is sub-millisecond.

Absolute numbers depend on network distance to `us-west-2` (the roadmap moves the
DB to `ca-central-1`, see `docs/data-map.md`) - treat them as **relative**.

## Results - before / after the T73 query batching

| Route | Before | After | Change |
|---|--:|--:|--:|
| `/parent` | 1412 ms | 654 ms | **-54%** |
| `/parent/compliance` | 1010 ms | 285 ms | **-72%** |
| `/admin` (overview) | 1206 ms | 639 ms | **-47%** |
| `/admin/compliance` | 1070 ms | 397 ms | **-63%** |
| `/admin/pods` | 780 ms | 402 ms | **-48%** |
| `/admin/ledger` | 1015 ms | 323 ms | **-68%** |
| `/student` | 762 ms | 684 ms | ~0 (not touched) |
| `/admin/inbox` | ~120 ms | ~120 ms | already minimal |

Rendered output was diffed before/after across every dashboard route - identical
except report timestamps (`assembledAt`).

## What was fixed - the N+1 loops

All four were "one query, then one more query per row of the result":

1. **`listPods`** (`lib/db/admin-queries.ts`) - was `2` queries per pod (members,
   progress) plus a per-course `count`. Now: one `pod_students` query and one
   `pod_progress` query for **all** pods (`.in("pod_id", ids)`), grouped in memory.
   `listCoursesWithNodeCounts` went from one `count` per course to a single
   `pathway_nodes` select tallied in memory.
   Query count for M courses / N pods: `2 + M + 2N` -> **~4, constant**.

2. **`getChildReport` -> `getChildReports`** (`lib/db/parent-queries.ts`) - the
   per-course `pathway_nodes` count is gone (one batched select), and the whole
   function is now **batched across children**: `~7` queries whether it's one child
   (`/parent`) or the entire pod (`/admin` compliance spread, which previously fired
   `~7 x 4 = 28`). `getChildReport` is now a one-line wrapper over the batch.

3. **`getSponsoredOutcomes`** (`lib/db/sponsorship-queries.ts`) - was `4` queries
   per sponsorship row (unit nodes, pod progress, roster, assessment results). Now:
   one batched query per table over all sponsorship rows + one assessment-results
   query, assembled in memory. For S sponsorships: `1 + 4S` -> **~5, constant**.

4. **`/parent` double-fetch** - the page loaded each child's report and then
   `assembleComplianceReport` re-loaded the same report to compute the status
   badge. Added `assembleFromChildReport()` (pure, no DB); the page now reuses the
   report it already has.

## If this had 50 masjids

**Stays fine.** Every query is already `masjid_id`-scoped (or scoped through a
join + explicit check). A masjid's dashboard only ever reads its own pods /
students / results, so per-masjid render time is independent of how many *other*
masjids exist - 50 masjids is 50x the total rows but 1x the rows any one page
touches. Row counts per masjid are tiny (<= 4 students/pod, a handful of pods, one
unit per course in the current scope).

**Needs an index.** The hosted Postgres has primary keys and FK constraints but we
have not audited secondary indexes. Before real traffic, add indexes on the
columns these batched queries filter by:
`pod_students(pod_id)`, `pod_students(student_user_id)`,
`pod_progress(pod_id)`, `pathway_nodes(course_id)`, `pathway_nodes(unit_id)`,
`checkpoint_results(student_user_id)`, `unit_assessment_results(student_user_id, unit_id)`,
`term_exam_results(student_user_id)`, `waqf_ledger(masjid_id)`,
`support_requests(masjid_id, status)`. (Tracked with T31 - the RLS pass touches
every table anyway.)

**Needs pagination / a materialized rollup.** Two places assume a small masjid:
- `/admin` overview loads *every* student's full report to compute the 3-number
  compliance spread. At ~30+ students that should be a single aggregate query
  (or a nightly-refreshed `masjid_compliance_summary`), not N reports.
- `listStudents` / `listPods` return the whole masjid unpaginated. Fine at <= ~50
  rows; add keyset pagination before a masjid outgrows one screen.

**Move the DB closer.** The largest single cost right now is round-trip latency to
`us-west-2`. `ca-central-1` (required anyway for data residency - `docs/data-map.md`)
removes most of the absolute numbers above.

## The AI calls are not in this budget

Lesson / checkpoint / assessment / briefing generation calls Anthropic, which is
seconds, not milliseconds - but that happens **once**, on an admin action or a
seed script, and the result is persisted (`pathway_nodes.lesson_content` etc.).
No student- or parent-facing page ever waits on a model call. See `docs/pitch.md`
for why that shapes the operating cost.
