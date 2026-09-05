---
id: T24
title: Waqf principal "never touched" visual
phase: 7
status: todo
owner: —
claimed: —
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
- [ ] Ledger view shows principal (locked/static) vs. cumulative returns spent as a
      single clear visual
- [ ] Principal is never summed into any "spendable" figure (already a data rule)
- [ ] Readable in light and dark

## Notes (owner appends)
