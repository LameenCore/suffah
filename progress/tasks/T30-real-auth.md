---
id: T30
title: Replace dev-cookie auth with Supabase Auth
phase: 9
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
lib/auth resolves the user from a `suffa-dev-role` cookie. That is fine for the  demo but is
the #1 thing to fix for a pilot. Every call site already uses  SessionUser, so the swap is
contained.

## Done when
- [ ] Supabase Auth: email/password + Google + Microsoft (families have these)
- [ ] users.role + users.masjid_id read from the session; getCurrentUser/requireRole
      unchanged for callers
- [ ] Dev role cookie kept behind NEXT_PUBLIC_SUFFA_DEV_ROLE for local/demo only
- [ ] Sign-in / sign-out / session-refresh flows; middleware guards the route groups

## Notes (owner appends)
