---
id: T45
title: AI lesson tutor (grounded Q&A)
phase: 11
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T08:30:00Z
completed: 2026-09-06T09:15:00Z
updated: 2026-09-05
outcome: |
  migration 0014_tutor_messages (per student+node, role student|tutor, flagged;
  UPDATE blocked by trigger, DELETE allowed for resets + Law 25 erasure).
  lib/ai/tutor.ts: askTutor() - context is ONLY the node's lesson (summary,
  sections, worked example, key terms, practice PROMPTS not answers; no
  checkpoint_content) + hard system rules: OFF_TOPIC -> a redirect to enrichment,
  ESCALATE -> "talk to a parent/volunteer", never leak practice/checkpoint
  answers, 2-5 sentences, no AI self-reference. messages.create (not structured);
  fallback line on model failure; both turns persisted; logModelCall(feature:
  "tutor") + rate-limited (assertAiRateLimit "tutor" in the action).
  getTutorTranscript (grouped by node, masjid-scoped) + countRecentTutorQuestions.
  UI: TutorPanel.tsx (collapsible chat) on the lesson page under LessonView;
  TutorTranscriptView.tsx on /parent/compliance (own child) and /admin/compliance
  (any student = volunteer review). Engagement: tutor questions count toward
  getConsistency's active days. check-integrity check 13.
  Verified live via script: on-topic -> grounded age-appropriate answer using the
  lesson's vocabulary; "best video game?" -> flagged + redirected; 4 turns
  persisted; consistency counts the day; UPDATE rejected. demo:reset clears
  tutor_messages + review_items. build + lint + tsc + 62 tests + check:integrity
  green.
commits: bf29d17
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
A student stuck on a lesson has no one to ask until the next enrichment session. A
guardrailed tutor answers questions about the current lesson only.

## Done when
- [x] TutorPanel on the lesson page; context = that node's lesson only (+ course)
- [x] Guardrails: OFF_TOPIC / ESCALATE sentinels -> safe canned replies; practice
      answers stripped from context, no checkpoint_content
- [x] tutor_messages transcript per student+node; parent (/parent/compliance) +
      volunteer/admin (/admin/compliance) review; counts toward getConsistency

## Notes (owner appends)
- 2026-09-05: model failure -> a fixed fallback line (no offline tutor). Safety
  sentinels are matched on the reply prefix; if the model ever ignores them the
  worst case is an on-topic answer, not a leak (context has no answers).
- countRecentTutorQuestions exists but isn't surfaced yet - hook it into the
  parent "this week" summary or the analytics dashboard (T64) later.
