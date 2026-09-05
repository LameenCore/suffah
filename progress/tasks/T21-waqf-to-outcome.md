---
id: T21
title: Waqf-to-outcome linking (donor sees learning, not just fund flow)
phase: 7
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T17:50:00Z
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
- [ ] Transparency view lists sponsored items with an outcome trace (not just $ flow)
- [ ] Outcomes are anonymized (pod-level, no student names)
- [ ] Mock sponsorship links seeded; note in UI that linking is illustrative

## Notes (owner appends)
- Per competitive research: keep as a compelling pitch-deck screen with a mocked
  mapping — not essential to the core loop, but differentiates from existing waqf-tech.
