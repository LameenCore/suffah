---
id: T77
title: Judge Q&A prep bank - drafted answers
phase: 14
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T23:55:00Z
completed: 2026-09-06T00:10:00Z
updated: 2026-09-05
depends_on: []
rubric: Delivery 30%
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
outcome: docs/qa-prep.md - drafted answers for all 8 checklist categories (technical impl,
  impact/users, demo/functionality, business/scale, team/process, data/privacy, future,
  closing), each with a "Backed by:" repo pointer. Honest where it counts (what's mocked,
  LLM dependency + the fallback story, coverage number deferred to T74 not faked).
  Team/process answers left as prompts for the team.
commits: <t77>
---

## Why
Delivery: a mock Q&A should feel natural. Pre-draft an answer to every question in the
MuslimHacks checklist (technical impl, impact/users, demo/functionality, business/scale,
team/process, data/privacy, future, closing).

## Done when
- [x] docs/qa-prep.md - every checklist question with a drafted answer + a "Backed by:"
      pointer to the file/doc that supports it
- [x] Honest answers: mocked vs real spelled out, "yes it depends on an LLM" + the
      persist-once / code-grading / hand-authored-fallback story, coverage number pointed
      at T74 rather than invented
- [x] The 4 closing answers tight (different / need / remember / why win)

## Notes (owner appends)
- Docs-only; no collision with T25.
- Team/process (4 questions) can't be answered from the repo - left as framed prompts
  with candidate answers for the team to confirm.
- Feeds T78 (mock Q&A) - stress-test the cost / Law 25 / "just an AI wrapper" / "volunteer
  quits and it collapses" answers there.
