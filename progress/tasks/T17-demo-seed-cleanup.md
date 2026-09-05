---
id: T17
title: Seed data cleanup for demo walkthrough
phase: 6
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
completed: 2026-09-05T00:00:00Z
outcome: npm run demo:setup (full, ~24 model calls) + demo:reset (state only, seconds).
  gen:lessons/gen:checkpoints now cover all 9 nodes. seed-demo-progress reworked so Yusuf
  is fresh on Math for step 1; Maryam watch / Idris gap / Safiya gap. TASKS.md demo script
  + README rewritten. Ran it end to end, verified all demo routes on localhost:3000.
commits: accd332, <t17>
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
depends_on: [T10, T11, T12, T14]
---

## Goal
Clean seed data so the demo runs smoothly start to finish: one pod, 3-4 students, one
volunteer, all three courses with at least one completed unit.

## Done when
- [x] Seed produces a coherent end-to-end demo state
- [x] Demo script (TASKS.md) walks cleanly with the seed

## Notes (owner appends)
- `npm run demo:setup` — one command: migrate + seed + generate ALL lessons/checkpoints
  (not just node 1) + assessments + exams + seed:continuity + seed:progress. ~24 model
  calls, a few minutes.
- `npm run demo:reset` — state only, no API: seed:progress --reset (pod → node 1, clears
  student results, reinstates + reassigns Br. Kareem) + seed:continuity --reset (notes +
  fresh briefing). Run between practice runs.
- Demo state: **Yusuf is fresh on Math** (default `student` role + the parent's linked
  child) so demo step 1 completes live. Maryam = watch, Idris = gap (Math), Safiya = gap
  (failed AI term exam) — the compliance-report spread.
- gen:lessons / gen:checkpoints now do all nodes by default; `-- --first` for node 1 only.
- TASKS.md demo script rewritten with concrete routes + the seeded starting state.
