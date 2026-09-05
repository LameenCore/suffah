---
id: T71
title: Architecture: legible + justified for the project
phase: 14
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T03:50:00Z
updated: 2026-09-05
depends_on: []
rubric: Technical 30% (sw)
source: MuslimHacks judging rubric (Business 40% / Technical 30% / Delivery 30%)
---

## Why
Judges score "make the architecture legible and justify why it fits". docs/  ARCHITECTURE.md
describes the shape; add the WHY - why one Next app + Supabase +  Anthropic (not
microservices, not a separate Python service, not a vector DB),  why persist generated
content, why service-role + app-code tenancy for now.

## Done when
- [ ] A 'why this architecture' section in docs/ARCHITECTURE.md (or docs/architecture-
      rationale.md): each major choice with the alternative rejected and the reason
- [ ] One current diagram: routes -> lib -> Supabase/Anthropic, showing where tenancy is
      enforced
- [ ] The known tradeoffs called out (service-role blast radius, dev auth) with the roadmap
      task that fixes each

## Notes (owner appends)
