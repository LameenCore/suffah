---
id: T07
title: lib/ai/checkpoint.ts — generate + grade checkpoint, gate progression
phase: 2
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: [T05, T06]
---

## Goal
Generate an objective checkpoint question tied to a lesson node, grade it (MCQ / short
numeric — no rubric grading), persist to checkpoint_results, gate advance to next node.
Completes the Phase 2 milestone: lesson -> checkpoint -> advance in >=1 course.

## Done when
- [ ] lib/ai/checkpoint.ts generates + grades a checkpoint
- [ ] Result persists to checkpoint_results
- [ ] Passing gates progression to the next pathway node
- [ ] MILESTONE: full loop works end to end in at least one course

## Notes (owner appends)
