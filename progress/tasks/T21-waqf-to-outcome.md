---
id: T21
title: Waqf-to-outcome linking (donor sees learning, not just fund flow)
phase: 7
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T17:50:00Z
completed: 2026-09-05T18:05:00Z
updated: 2026-09-05
depends_on: [T14, T08]
tier: 1
build_or_mock: mock
---

## Why
Blockchain waqf transparency already exists but stops at "where did the money go".
Nobody links an endowment contribution to a *learning outcome trace*: a donor who
funded "Pod 3's Seerah unit" sees (anonymized) that the pod completed the unit and
passed its assessment. Reframes waqf from charity accounting to "sponsor a child's
education, see it happen".

## Goal (hackathon: mocked screen, real data where cheap)
- A donor/transparency view that shows, per funded item: the fund entry → the pod/unit
  it sponsored → the anonymized outcome (unit completion %, assessment pass rate).
- Link is a simple `sponsorship` mapping (ledger_entry_id → pod_id + unit_id), seeded
  with mock links; outcomes pulled from real `unit_assessment_results` / progress.

## Done when
- [x] Transparency view lists sponsored items with an outcome trace — "Sponsored
      outcomes" section on /admin/ledger (contribution → pod + unit → progress % +
      assessment pass count)
- [x] Outcomes are anonymized — pod name + "x of y students", no student names
- [x] Mock sponsorship links seeded (3) + UI disclaimer that linking is illustrative

## Notes (owner appends)
- Per competitive research: keep as a compelling pitch-deck screen with a mocked
  mapping — not essential to the core loop, but differentiates from existing waqf-tech.
- Migration 0006_sponsorships.sql (sponsor_label + amount + pod_id + unit_id, mock).
  Seeded in supabase/seed.sql + scripts/seed.ts — needs `npm run migrate` + `npm run
  seed` on a live DB. Outcomes read from real pod_progress / unit_assessment_results.
- lib/db/sponsorship-queries.ts; components/admin/SponsoredOutcomes.tsx (server).
  build + lint green; not verified vs live data.
- commits: <t21>. Session tally: T10,T11,T13,T14,T15,T21,T24.
