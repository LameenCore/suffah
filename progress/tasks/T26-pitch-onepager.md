---
id: T26
title: Pitch one-pager + unit-economics model
phase: 8
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T20:30:00Z
completed: 2026-09-05T21:00:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: docs/pitch.md - problem -> model -> waqf funding -> unit economics -> market ->
  moat -> what's built -> the ask, with a 30-second TL;DR. docs/research/model-economics.md
  backs the numbers (Quebec homeschool + Muslim population figures, endowment 4% draw,
  Sonnet 5 pricing -> ~$0.30 one-time content cost per unit per masjid, ~$0 grading).
commits: 3b83dc1
---

## Why
CLAUDE.md: "business-model deliverable FIRST". The repo has a PRD but no judge-facing pitch
artifact and no numbers behind the waqf model. This is the primary deliverable and it was
missing.

## Done when
- [x] docs/pitch.md: problem -> model -> funding narrative (mirrors the 5-step demo script)
- [x] Unit economics: 4% endowment draw, ~$0.30 one-time content cost / unit / masjid,
      ~$0 grading, near-zero marginal cost per student, "viable from the first family"
- [x] 30-second TL;DR + skimmable sections; numbers sourced (docs/research/model-economics.md)
      or explicitly labelled as assumptions

## Notes (owner appends)
- Docs-only; no code touched (T25 UI redesign is holding app/ + components/).
- Key economic insight surfaced: because lessons/checkpoints/exams are generated once and
  persisted (the codebase enforces this) and grading is deterministic code, AI is a
  one-time per-curriculum cost, not per-student-per-lesson - so the model breaks even at
  one family, unlike tuition-funded schooling.
- Used WebSearch for Quebec figures + endowment norms; the claude-api skill for Sonnet 5
  pricing. Research note: docs/research/model-economics.md.
