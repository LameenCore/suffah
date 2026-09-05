---
id: T13
title: waqf_ledger table + mock entries
phase: 5
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T15:20:00Z
completed: 2026-09-05T15:35:00Z
updated: 2026-09-05
depends_on: [T03]
outcome: waqf_ledger already exists (0001_init.sql). Enriched the mock ledger to an
  11-row ~15-month series in both supabase/seed.sql and scripts/seed.ts (kept in sync):
  1 locked principal deposit (250k), 5 rising quarterly return_disbursed draws, 3
  sadaqah_received top-ups, 2 scholarship_allocated. Gives T14's "principal flat vs
  return spent" chart real shape. No new migration. build + lint green.
commits: <t13>
---

## Goal
waqf_ledger table populated with MOCK entries: one principal deposit, several
return-disbursed entries, a couple of sadaqah / scholarship entries. No payment processing.

## Done when
- [x] waqf_ledger table exists (migration) — 0001_init.sql (unchanged)
- [x] Mock entries seeded — supabase/seed.sql + scripts/seed.ts

## Notes (owner appends)
- Not run against a live DB (`.env.local` absent here). seed.sql is valid SQL; seed.ts
  type-checks under `next build`.
- DATA_MODEL constraint carried into the seed comments: principal entries must never be
  summed into "spendable" totals — that's a query concern for T14.
