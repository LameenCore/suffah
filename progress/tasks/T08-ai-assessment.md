---
id: T08
title: lib/ai/assessment.ts — unit assessment
phase: 3
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T07]
outcome: lib/ai/assessment.ts generates a cumulative unit assessment from the unit's
  lessons (persisted to units.assessment_content, migration 0004), grades objectively
  (0.7), writes unit_assessment_results. Shared lib/ai/questions.ts (checkpoint refactored
  onto it). POST /api/assessments/{generate,grade}. npm run gen:assessments. Verified.
commits: 626d367, <t08>
---

## Goal
Generate a unit assessment drawing on 2-3 checkpoint nodes' material; grade objectively;
persist to unit_assessment_results.

## Done when
- [x] lib/ai/assessment.ts generates a unit assessment
- [x] Result persists to unit_assessment_results

## Notes (owner appends)
- Shared `lib/ai/questions.ts` = question schema + objective grading, used by checkpoint,
  assessment, and (T09) term exam. `buildAssessmentPrompt(..., kind)` takes "unit" | "term".
- Assessment persisted on `units.assessment_content`; `unit_assessment_results` holds each
  attempt (score 0-1, passed bool).
- Demo scope: unit assessments currently cover only node 1 of each unit (nodes 2-3 have no
  lesson yet). `coversTitles` reflects what's actually covered.
- FOLLOW-UP: student "take the unit assessment" panel on /student/[courseId] not yet wired
  (assessment logic + `/api/assessments/*` + `getUnitCheckpointProgress` gate all exist).
  Small task — see T08b in tasks/ if split out, else fold into T17/demo polish.
