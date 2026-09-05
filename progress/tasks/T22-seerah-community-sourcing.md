---
id: T22
title: Multi-generational knowledge sourcing for Seerah content
phase: 7
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T18:45:00Z
updated: 2026-09-05
depends_on: [T05]
tier: 2
build_or_mock: mock
---

## Why
Seerah has no external curriculum vendor. Let the masjid's own scholars/elders react
to or expand AI-generated lesson drafts; their input gets woven into the next version
of the lesson. A genuine AI+community hybrid — not AI in a vacuum, not purely
human-authored. Only makes sense with exactly this community structure.

## Goal (hackathon: text version of the loop)
- A `lesson_contributions` table (node_id, contributor name/role, note text, created_at).
- Admin/scholar view: see a lesson draft, submit a note ("mention the boycott of Banu
  Hashim here", "the date is disputed — say 'around 610 CE'").
- "Incorporate contributions" action → `generateLessonForNode(..., { reviseWith:
  contributions })` regenerates the lesson folding the notes in; bump a version field.

## Done when
- [ ] lesson_contributions table + a submit form
- [ ] Lesson regeneration can take contributions as input and fold them in
- [ ] Lesson carries a version / "revised with community input" indicator

## Notes (owner appends)
- Voice notes are out of hackathon scope — text notes prove the pipeline. Mention voice
  as the productionization step in the pitch.
