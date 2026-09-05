---
id: T14
title: Admin ledger view + family fee status
phase: 5
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T15:50:00Z
completed: 2026-09-05T16:15:00Z
updated: 2026-09-05
depends_on: [T13, T11]
outcome: /admin/ledger — 4 stat tiles (locked principal, returns disbursed, sadaqah,
  scholarships), a single-axis cumulative-spend area chart (0 → principal, dashed
  principal reference line, hover crosshair+tooltip, table view in a <details>), and a
  family fee-status list. lib/db/ledger-queries.ts keeps principal out of every "spent"
  total per DATA_MODEL. Chart is inline SVG (no lib); dataviz palette validator passes
  light + dark. Admin home "ledger" card now links here.
commits: <t14>
---

## Goal
Admin ledger view: principal balance (flat, untouched) vs cumulative return spent — a
chart, not a transaction engine. Plus family fee status: a couple students fee_paid, one
scholarship_covered. Read the dataviz skill before building the chart.

## Done when
- [x] Ledger chart: principal vs return-spent — cumulative money-out vs dashed principal line
- [x] Family fee status view — list + paying/scholarship counts

## Notes (owner appends)
- Read the dataviz skill first. Form: stat tiles carry the headline; one single-axis
  chart (never dual-axis) where "spend barely lifts off the floor vs the principal line"
  IS the message. One series → no legend; direct label on the last point; hover layer +
  table view per the skill. `node scripts/validate_palette.js "#2a78d6" --mode light`
  and `"#3987e5" --mode dark` both PASS.
- Not visually verified against live data (`.env.local` absent here) — build + lint green,
  page falls back to a friendly panel when Supabase is unconfigured.
- New files only (lib/db/ledger-queries.ts, components/admin/LedgerChart.tsx,
  app/admin/ledger/*) + the one Link swap in app/admin/page.tsx — no overlap with the
  session on T08.
