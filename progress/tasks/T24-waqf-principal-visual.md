---
id: T24
title: Waqf principal "never touched" visual
phase: 7
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T17:25:00Z
completed: 2026-09-05T17:40:00Z
updated: 2026-09-05
depends_on: [T14]
tier: 3
build_or_mock: build
---

## Why
Teaches judges what waqf *is* in ~3 seconds if the panel isn't familiar with Islamic
finance: the principal is a locked, static number; only a thin stream flows out as
"returns spent". Visual, not a table.

## Goal
- On the Admin ledger view (T14), a simple diagram: principal balance as a fixed,
  visually "locked" block that never changes; returns disbursed as a thin outflow
  over time; sadaqah as a separate top-up into the scholarship pool.
- Inline SVG, theme-aware, no chart library needed. Light animation on the outflow
  is nice-to-have, not required.

## Done when
- [x] Ledger view shows principal (locked/static) vs. cumulative returns spent as a
      single clear visual — components/admin/WaqfFlowDiagram.tsx on /admin/ledger
- [x] Principal is never summed into any "spendable" figure — getLedgerSummary keeps
      principal on its own line; totalOut excludes it (T14)
- [x] Readable in light and dark — CSS-var theming, both dark scopes

## Notes (owner appends)
- Inline SVG, server component (pure-CSS dash animation, disabled under
  prefers-reduced-motion — no SMIL, no library). Locked padlock block for the
  principal; thin animated streams for returns→operations and sadaqah→scholarship
  pool, visually separate from the principal.
- Placed as a "How the waqf works" section above the time-series chart on /admin/ledger.
- build + lint green. Not visually verified vs a running server (no .env.local) — geometry
  is hand-checked within the 720×240 viewBox.
- commits: 8e8bc04
