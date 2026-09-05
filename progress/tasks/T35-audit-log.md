---
id: T35
title: Audit logging for sensitive actions
phase: 9
status: doing
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T03:00:00Z
updated: 2026-09-05
depends_on: [T30]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Judges will ask 'who can change what and is it recorded'. Pod assignments, volunteer
departures, compliance snapshots, report exports, fee-status changes should leave a trail.

## Done when
- [ ] audit_log table (actor, action, target, masjid_id, at, metadata)
- [ ] Every admin Server Action writes an entry; an admin-only view to read the trail
- [ ] Entries are append-only; no PII beyond ids + action names

## Notes (owner appends)
