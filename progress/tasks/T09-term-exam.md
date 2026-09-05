---
id: T09
title: Term exam variant (timed) + term_exam_results
phase: 3
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T08]
outcome: lib/ai/term-exam.ts reuses buildAssessmentPrompt(...,"term") + questions.ts
  grading. Cumulative 8-12 questions across the whole course, persisted to term_exams
  (migration 0007), timed (durationSeconds, UI countdown + auto-submit), no remedial
  branch. Attempts → term_exam_results. /student/[courseId]/exam page, POST
  /api/exams/{generate,grade}, npm run gen:exams. Verified end to end.
commits: 5f8ad73, <t09>
---

## Goal
Term exam = unit assessment logic behind a flag: timed, no remedial branch.
Persist to term_exam_results.

## Done when
- [x] Term exam reuses assessment logic behind a flag
- [x] Result persists to term_exam_results

## Notes (owner appends)
- Storage: `term_exams` table (course_id, term_label, exam_content), unique per
  (course, term). `term_exam_results` (0001) has no `passed` column — pass/fail is
  computed for the UI and stored inside `answer_data`.
- Term label constant: `DEMO_TERM_LABEL` ("Fall 2026") in lib/types.ts — used by the
  script, the student pages, and (T12) the compliance report.
- "Timed" is enforced client-side: countdown from `durationSeconds`, auto-submit at 0.
- Migration numbering note: 0006/0007 each have two files (parallel agents). Harmless —
  every migration uses `create ... if not exists` and there are no cross-file deps.
  A timestamp prefix scheme would be cleaner if this continues.
