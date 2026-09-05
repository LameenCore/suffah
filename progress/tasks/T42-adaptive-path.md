---
id: T42
title: Adaptive path: remediation branch + skip-ahead
phase: 11
status: doing
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T09:30:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The PRD names a 'remedial branch decision' but the built loop just gates on  pass/fail.
Within objective grading we can still branch: a failed checkpoint  routes to a targeted re-
teach; a high score can skip a node.

## Done when
- [ ] On checkpoint fail: a short AI re-teach focused on the missed concept, then a fresh
      checkpoint variant
- [ ] On a strong pass (config threshold): offer to skip the next node if its checkpoint is
      also passed cold
- [ ] Branch decisions persisted; the parent/compliance view shows the path taken

## Notes (owner appends)
