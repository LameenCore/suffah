---
id: T31
title: Postgres RLS policies per table
phase: 9
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T06:45:00Z
updated: 2026-09-05
depends_on: [T30]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
All server DB access uses the service-role client, so the application-code  `masjid_id`
filter is currently the ONLY tenant boundary (flagged in  docs/review/2026-09-05-audit.md).
RLS is defense in depth.

## Done when
- [ ] RLS enabled on every table; policies scope rows by masjid_id / ownership via the auth
      JWT
- [ ] Server code moved to the anon/authed client where it suffices; service-role reserved
      for genuine admin jobs
- [ ] A test proving a cross-tenant read/write is refused at the DB, not just in app code

## Notes (owner appends)
