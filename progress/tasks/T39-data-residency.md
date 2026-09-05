---
id: T39
title: Canadian data residency + data map
phase: 10
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T21:50:00Z
completed: 2026-09-05T22:10:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: docs/data-map.md - full data inventory (every table -> store -> region -> PIM? ->
  sent-to-Anthropic?), the cross-border flows (only one by design: the Anthropic API call;
  the continuity briefing is the sensitive one - names + progress), target state
  (ca-central-1 + Canadian Vercel region), and a 6-step migration plan from the current
  us-west-2 project. Minimisation list led by "pseudonymise students before the briefing
  call".
commits: 539caf8
---

## Why
Quebec institutions and families will ask where the data lives. Supabase region + a written
data-flow map.

## Done when
- [x] Documented current region (Supabase **us-west-2** - confirmed from the pooler host)
      and the 6-step migration plan to ca-central-1 (cheap now, one demo masjid). Actual
      project move needs the user's Supabase dashboard.
- [x] docs/data-map.md - every data category -> store -> region -> processor, with a
      PIM (personal-info-about-a-minor) flag per category
- [x] Cross-border processing spelled out: the Anthropic API is the only one by design;
      the continuity-briefing call (child first names + progress) is the sensitive flow;
      Law 25 basis (PIA before out-of-Quebec transfer) noted

## Notes (owner appends)
- Docs-only; no code touched (T25 holds app/ + components/).
- Key finding: the demo DB is in **AWS us-west-2 (US)**, not Canada - fine for the
  hackathon, must move before any real family. Migration is minutes while it's one masjid.
- Highest-value minimisation: pseudonymise students to "Student A/B/C" in the briefing
  prompt and map back client-side - removes the only children's-names cross-border flow.
