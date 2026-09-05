---
id: T20
title: Compliance report as a living document (early-warning, not export)
phase: 7
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T12]
tier: 1
build_or_mock: build
outcome: lib/compliance/status.ts — per-course on_track/watch/gap with human-readable
  signals, computed live from checkpoint/unit/exam data + pod position; computeOverall =
  worst-of. Rendered on /admin/compliance AND /parent/compliance; the export (print page)
  is a snapshot of the same live view. Built as one piece with T12.
commits: 7ab3e4b, <t12t20>
---

> Built as one piece with T12 — the status engine is baked into the compliance
> report from the start rather than retrofitted.

## Why
Existing homeschool tools are backward-looking recordkeeping. Reframe the regulatory
obligation as a forward-looking early-warning system: "on track for the evaluation
requirement" vs. "gap forming in Math" — visible to family + masjid in real time,
not a dreaded term-end PDF.

## Goal
Extend T12's compliance report so it is:
- Continuously assembled from live checkpoint / unit-assessment / (later) exam data.
- Shows per-course status indicators: on-track / watch / gap, with the reason
  ("no unit assessment attempted this term", "checkpoint pass rate 40%").
- Still exportable (T12's printable view) — the static export is a snapshot of the
  living view, not a separate thing.

## Approach
- A `lib/compliance/status.ts` pure function: given a student's results + the course's
  pathway/unit structure + term dates, return `{ course, status, signals[] }`.
- Thresholds are hardcoded + carry the "verify with current regulation" note.
- Parent dashboard (T10) and Admin compliance view (T12) both render the same status.

## Done when
- [x] Per-course status (on-track / watch / gap) computed from live data
- [x] Each status carries human-readable signals explaining it
- [x] Shown on both parent and admin views; export reflects current state
- [x] Regulation-verification note present

## Notes (owner appends)
