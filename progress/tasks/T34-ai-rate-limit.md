---
id: T34
title: Rate limiting + abuse guards on AI endpoints
phase: 9
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The /api/*/generate + /api/demo/reset routes call the model / mutate data with only a role
check. A stuck loop or a hostile authed user could run up cost.

## Done when
- [ ] Per-user + per-masjid rate limits on generation endpoints (token bucket / Upstash)
- [ ] Idempotency: a second identical generate request returns the persisted row, never a
      new model call
- [ ] Structured logging of every model call (who, what, tokens, cost, source)

## Notes (owner appends)
