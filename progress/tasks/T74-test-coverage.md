---
id: T74
title: Test coverage: measure it, report the number
phase: 14
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: [T55]
rubric: Technical 30% (sw)
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
---

## Why
Judges score "add tests and know your coverage numbers". T55 added 33 unit  tests; now turn
on coverage, get the number, and add tests for the next-most-  important untested logic
(checkpoint gating, pod-cap enforcement, the compliance  status thresholds' boundaries).

## Done when
- [ ] `npm run test:coverage` (vitest --coverage) wired; the % for lib/ reported in README +
      the pitch
- [ ] Coverage gaps triaged: test the ones that matter (grading edge cases already done; add
      gating + cap + status boundaries), explicitly skip the ones that don't (thin wrappers)
- [ ] A one-line honest coverage statement for Q&A ('~X% of lib/, the core loop and money
      math are covered')

## Notes (owner appends)
