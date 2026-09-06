---
id: T51
title: Question bank management + item analytics
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T13:00:00Z
updated: 2026-09-05
depends_on: [T50]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Checkpoint/assessment/exam questions are generated and buried in JSON. A managed bank lets
admins review, disable weak items, and see which questions discriminate.

## Done when
- [x] /admin/question-bank: every checkpoint question per course; enable/disable an
      item (immediate). Editing is done in /admin/authoring (T50) - the bank links there.
- [x] lib/analytics/item-analytics.ts: p-value + upper/lower-27% discrimination index
      from checkpoint_results.answer_data.perQuestion. Pure + tested (6 cases).
- [x] Flags: too_hard / too_easy / negative_discrimination / weak_discrimination /
      insufficient_data. gradeCheckpoint + stripAnswers (student view + offline route)
      skip disabled items - a disabled question can't be graded or shown.

## Outcome (session 01KZau4, 2026-09-05)

migration 0020_question_bank: `question_overrides` (sparse; masjid + source_kind +
source_id + question_id -> disabled + note). lib/db/question-bank-queries.ts:
listQuestionBank (flatten checkpoint JSON + attach overrides + per-item stats),
setQuestionOverride (tenant-checked upsert, audited question.disabled/enabled),
getDisabledCheckpointQuestionIds (the grader + student view use this).
lib/analytics/item-analytics.ts: computeItemStats (pure). /admin/question-bank +
QuestionBank client component; nav + i18n key. tests/item-analytics.test.ts (6).

Verified via script: bank lists 36 questions across 3 courses; disabling q1 on a
node makes an all-correct grade score 3/3 not 4/4 (item skipped); page renders,
parent -> 307. build + lint + tsc + 68 tests + check:integrity green.

Scope note: analytics currently cover checkpoint items (the table with real
attempt volume). Unit assessments / term exams reuse the same override table
(source_kind 'unit'/'term') but aren't surfaced in the UI yet.

## Notes (owner appends)
