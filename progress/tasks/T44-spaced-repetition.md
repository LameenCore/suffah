---
id: T44
title: Spaced-repetition review deck
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T07:30:00Z
completed: 2026-09-06T08:20:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: |
  migration 0013_review_items (per student+question: ease, interval_days, reps,
  lapses, due_at, last_correct). lib/review.ts: scheduleNext() pure trimmed SM-2
  (correct: 1d -> 3d -> interval*ease, ease creeps up; miss: reps=0, back to 1d,
  ease-0.2, floor 1.3); seedReviewItems (one item per question from every passed
  checkpoint, staggered over a few days, capped 12/run); getReviewDeck (due items
  -> stripped questions); submitReview (objective grade via gradeQuestion +
  reschedule + persist); getRetentionSignal (totalItems / dueNow / reviewedLast7
  / accuracyLast7). Student: /student/review page + ReviewDeck client component
  (reuses the checkpoint question UI), a "Review is ready - N questions" card on
  /student, and a "Review" sidebar item. submitReviewAction in student/actions.
  Retention feeds: continuity briefing (PodLearningSignals.retention per student
  -> renderSignals line + a fallbackBriefing watchFor when accuracy <60%) AND
  the compliance report (ComplianceReport.retention on the DB path -> a line in
  ComplianceReportView). demo:reset clears review_items.
  tests/review.test.ts (SM-2 boundaries, 5). 62 total. Verified end to end via a
  script: 3-card deck -> submit 1/3 -> items rescheduled -> deck empties,
  retention updates (dueNow 3->0, accuracyLast7 -> 0.33).
commits: <t44>

## Why
Passing a checkpoint once is not retention. A light review deck resurfaces a few items from
earlier passed nodes on an expanding schedule.

## Done when
- [x] review_items scheduled per student (trimmed SM-2); /student/review + a home card
- [x] Items drawn from passed checkpoints; objective grading (gradeQuestion); miss -> 1 day
- [x] getRetentionSignal feeds the continuity briefing (prompt + fallback watchFor) and
      the compliance report view

## Notes (owner appends)
- 2026-09-05: seeding is lazy - seedReviewItems runs on /student and /student/review
  load (best-effort). A cron/queue would be cleaner at scale; noted for later.
- New items are capped at 12 per seed run so a student who passed many checkpoints
  before this shipped doesn't get a 40-card day-one deck.
