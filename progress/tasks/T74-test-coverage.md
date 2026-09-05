---
id: T74
title: Test coverage: measure it, report the number
phase: 14
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T00:30:00Z
completed: 2026-09-06T00:55:00Z
updated: 2026-09-05
depends_on: [T55]
rubric: Technical 30% (sw)
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
outcome: @vitest/coverage-v8 + `npm run test:coverage`, coverage config scoped to lib/
  (excludes barrels, env/types, fallbacks, Supabase client factories). Added 5 boundary
  tests -> 38 total. Numbers: lib/ai/questions.ts (grading) 100%, lib/compliance/status.ts
  (engine) ~98%, overall lib/ ~8% by line (DB glue - needs the T54 harness; covered by
  check:integrity + live e2e instead). Honest statement written into README + pitch +
  docs/qa-prep.md.
commits: 412745f
---

## Why
Judges score "add tests and know your coverage numbers". T55 added the unit tests; this
turns on coverage, gets the number, adds boundary tests for the compliance-status
thresholds, and writes an honest coverage statement for Q&A.

## Done when
- [x] `npm run test:coverage` (vitest v8) wired + scoped to lib/; % reported in README + pitch
- [x] Gaps triaged: added pass-rate boundary tests (exactly 0.5 -> watch; exactly 0.70 ->
      no watch-signal) + the positives branches (unit + term-exam passed) + computeOverall
      headlines/empty. Explicitly NOT unit-tested: the DB-bound helpers (gradeCheckpoint,
      addStudentToPod) - they need a Postgres harness (T54); check:integrity + the live
      run cover the tenancy/cap invariants today.
- [x] Q&A line: "grading 100%, status engine ~98%; overall lib/ ~8% by line because it's
      dominated by Supabase query glue that needs an integration harness"

## Notes (owner appends)
- devDep only (@vitest/coverage-v8 ^2.1.9 to match vitest 2); `coverage/` already gitignored.
- The ~8% headline number is honest and defensible - the important thing is WHERE the
  coverage is (the logic that can silently be wrong), not the aggregate.
