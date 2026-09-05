---
id: T34
title: Rate limiting + abuse guards on AI endpoints
phase: 9
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T04:00:00Z
completed: 2026-09-06T04:45:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: |
  lib/ratelimit.ts: in-memory sliding-window limiter (per-process; documented
  Upstash swap behind the same signature). enforceAiRateLimit() -> 429 Response
  for API routes, assertAiRateLimit() -> RateLimitError for Server Actions.
  Limits: 8/user/min + 40/masjid/min per feature. Applied to all 5 generate API
  routes + /api/continuity/briefing and the 3 student generate Server Actions.
  Verified live: 12 rapid /api/lessons/generate -> 8x through, then 429 with
  Retry-After.
  Idempotency: every generator already returns the persisted row without a model
  call when content exists; `force` regeneration is now admin-only (was open to
  students - a cost vector). So a repeat student request never re-calls the model.
  Model-call logging: migration 0011_model_call_log (append-only, same trigger
  pattern as audit_log) + lib/ai/usage.ts (logModelCall best-effort +
  estimateCostUsd, Sonnet 5 $2/$10 per MTok). Wired into all 5 model-call sites
  (lesson/checkpoint/assessment/term_exam/briefing) - logs feature, masjid,
  actor, tokens, cost, source (model|fallback), ok. actorUserId threaded from
  routes + actions. 24 seed rows (the demo's own curriculum generation) in
  seed.sql + seed.ts; check-integrity check 12 proves append-only.
  Tests: tests/ratelimit.test.ts (7) + tests/ai-usage.test.ts (5). 50 total green.
  This unblocks T56 (AI-spend rollup view builds on model_call_log).
commits: 05cbdb5
---

## Why
The /api/*/generate + /api/demo/reset routes call the model / mutate data with only a role
check. A stuck loop or a hostile authed user could run up cost.

## Done when
- [x] Per-user + per-masjid rate limits on generation endpoints (in-memory sliding
      window; Upstash is the prod swap, same signature)
- [x] Idempotency: generators return the persisted row without a model call when
      content exists; `force` regen restricted to admins
- [x] Structured logging of every model call (feature, masjid, actor, tokens, cost,
      source, ok) -> model_call_log (append-only)

## Notes (owner appends)
- 2026-09-05: the limiter is per-process, so on serverless the effective ceiling
  is (limit x live instances). Fine as a cost guard for a pilot; swap to
  @upstash/ratelimit behind checkRateLimit() for a hard limit. Noted in
  lib/ratelimit.ts.
- /api/reports/generate + /api/demo/reset were left unlimited - neither calls the
  model; report snapshots and demo resets are cheap DB ops. Add a limiter there
  too if snapshot spam becomes a thing.
- T56 (AI spend monitoring) builds the per-masjid rollup + budget alerts on
  model_call_log - was blocked on this task, now unblocked.
