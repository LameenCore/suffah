---
id: T54
title: CI: lint + typecheck + build + tests on every PR
phase: 12
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-05T18:45:00Z
completed: 2026-09-05T18:55:00Z
updated: 2026-09-05
depends_on: [T55]
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: |
  .github/workflows/ci.yml - runs on push to main + every PR to main. One job:
  npm ci -> lint -> build -> test. `next build` covers typecheck (it generates
  the PageProps/LayoutProps route types this repo relies on, then runs tsc), so
  no separate tsc step and no env vars needed (lib/env.ts never throws at import,
  every DB/AI path has an unconfigured fallback). Caches npm deps (setup-node)
  and .next/cache. Concurrency-cancels superseded runs. Verified lint+build+test
  green locally this session; `npm ci --dry-run` confirms the lockfile is in sync.
  Two done-when items are GitHub/Vercel config, not a repo file - documented in
  Notes below: (a) branch-protection "required check" must be toggled in repo
  settings, (b) per-PR preview deploy is deferred to T27 (no Vercel project yet).
commits: 55d5cdb
---

## Why
Multiple agents/humans push to main. A gate catches regressions before they land.

## Done when
- [x] GitHub Actions: eslint, tsc/next build, and the T55 test suite on every PR + push
- [x] Required to pass before merge; caches deps + the Next build
      (caching done; "required" = a one-time repo-settings toggle, see Notes)
- [~] A preview deploy per PR (Vercel) for visual review - deferred to T27
      (no Vercel project exists yet; add a deploy job to ci.yml once it does)

## Notes (owner appends)
- 2026-09-05: To enforce the gate, in GitHub repo Settings -> Branches -> add a
  branch protection rule for `main` -> "Require status checks to pass" -> select
  `verify` (the CI job). Can't be done from a committed file.
- Node 22 in CI (repo dev is on 24; 22 is current LTS and Next 16 supports 20.9+).
- No `tsc --noEmit` step: it would need `.next/types/**` generated first, and
  `next build` already fails on type errors. If a standalone typecheck is wanted
  later, run it after the build step.
- When T27 lands Vercel: add a `deploy-preview` job (pull_request) using the
  Vercel CLI or the official action, gated on `verify` passing.
