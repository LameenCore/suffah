---
id: T07
title: lib/ai/checkpoint.ts — generate + grade checkpoint, gate progression
phase: 2
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T05, T06]
outcome: lib/ai/checkpoint.ts generates (structured output from the lesson, persisted to
  pathway_nodes.checkpoint_content) + grades objectively (0.7 threshold), writes
  checkpoint_results, advances pod_progress on pass. Student UI wired lesson→checkpoint.
  POST /api/checkpoints/{generate,grade}. Verified end to end: pass advanced Math node 1→2.
commits: b3f7efb, <t07>
---

## Goal
Generate an objective checkpoint question tied to a lesson node, grade it (MCQ / short
numeric — no rubric grading), persist to checkpoint_results, gate advance to next node.
Completes the Phase 2 milestone: lesson -> checkpoint -> advance in >=1 course.

## Done when
- [x] lib/ai/checkpoint.ts generates + grades a checkpoint
- [x] Result persists to checkpoint_results
- [x] Passing gates progression to the next pathway node
- [x] MILESTONE: full loop works end to end in at least one course

## Notes (owner appends)
- Checkpoint persisted on `pathway_nodes.checkpoint_content` (migration 0003), symmetric
  with `lesson_content`. `checkpoint_results` still holds the per-student attempt.
- Grading: MCQ = option-index match; short = normalized string OR numeric equality against
  `answer` + `acceptable[]`. No rubric grading (PRD non-goal).
- Pass advances the whole pod (`pod_progress.current_node_id`) — pods move together.
  `advancePodProgress` is forward-only (won't regress a pod that's already ahead).
- `npm run gen:checkpoints` after `npm run gen:lessons` to prep demo content.
