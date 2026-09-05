---
id: T71
title: Architecture: legible + justified for the project
phase: 14
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T03:50:00Z
completed: 2026-09-06T04:00:00Z
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
- [x] docs/architecture-rationale.md - 10-row choice->rejected-alternative->reason table in docs/ARCHITECTURE.md (or docs/architecture-
      rationale.md): each major choice with the alternative rejected and the reason
- [x] Current ASCII diagram: browser -> proxy -> Next app (layout gate, lib/ai, lib/db) -> Supabase/Anthropic, tenancy boundary marked: routes -> lib -> Supabase/Anthropic, showing where tenancy is
      enforced
- [x] 7-row tradeoffs table (service-role blast radius, late auth, US region, cross-border AI call, N+1, coverage, mocks) each -> its roadmap task called out (service-role blast radius, dev auth) with the roadmap
      task that fixes each

## Notes (owner appends)

## Notes (owner appends)
- New file docs/architecture-rationale.md + a pointer from ARCHITECTURE.md (the
  original is a stale plan). Cross-references docs/decisions.md rather than duplicating.
- Docs-only, no collision (T35 audit-log is the other active claim).
- commits: bcc2db8
