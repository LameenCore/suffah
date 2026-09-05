---
id: T55
title: Automated tests for the core loop
phase: 12
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T22:55:00Z
completed: 2026-09-05T23:25:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: vitest 2.x + vitest.config.ts (@/ alias, node env); `npm test` / `test:watch`.
  33 unit tests across tests/{questions,compliance-status,ledger}.test.ts covering
  gradeQuestion/gradeQuestions/stripQuestionAnswers, computeCourseStatus/computeOverall,
  and the extracted-pure summariseLedgerEntries (principal never in totalOut). Found +
  fixed a real grading bug: a trailing period marked a short answer wrong ('Paris.' !=
  'Paris') - own commit 0916e15. README documents npm test + check:integrity.
commits: 0916e15, 7248ad6
---

## Why
Zero automated tests today. The lesson -> checkpoint -> advance loop, objective grading, and
compliance-status computation are the parts that must not silently break.

## Done when
- [x] Unit tests: gradeQuestion / gradeQuestions (MCQ index / missing / non-numeric;
      short exact / normalized / acceptable / numeric tolerance / negatives / missing),
      computeCourseStatus + computeOverall (all levels), summariseLedgerEntries (principal
      never counted, cumulative series, empty=zeros). 33 tests, all pass.
- [~] Integration tests (mark-complete -> checkpoint -> advance; cross-tenant refused) -
      partial: the tenancy path is already covered by scripts/check-integrity.ts + the
      earlier live verification; a full test-schema integration harness is left for T54
      (CI) since it needs a throwaway Postgres. Noted below.
- [x] `npm test` documented in README; runs headless; ready to wire into CI (T54)

## Notes (owner appends)
- vitest@2 not @5: @5 needs @types/node >=22, project pins ^20. @2.1.9 is peer-clean.
- The 5 npm-audit vulns are transitive vite/esbuild dev-dep noise; not fixing with
  --force (breaking). Flag for a later dep bump.
- Extracted summariseLedgerEntries() from getLedgerSummary so the invariant is testable -
  the only lib/ change; no app/ or components/ (T25).
- Integration (DB) tests deferred to T54: they need `pg` + a per-run throwaway schema,
  which is CI plumbing. The pure logic - where the subtle bugs live - is covered now.
