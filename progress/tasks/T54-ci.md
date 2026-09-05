---
id: T54
title: CI: lint + typecheck + build + tests on every PR
phase: 12
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: [T55]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Multiple agents/humans push to main. A gate catches regressions before they land.

## Done when
- [ ] GitHub Actions: eslint, tsc/next build, and the T55 test suite on every PR + push
- [ ] Required to pass before merge; caches deps + the Next build
- [ ] A preview deploy per PR (Vercel) for visual review

## Notes (owner appends)
