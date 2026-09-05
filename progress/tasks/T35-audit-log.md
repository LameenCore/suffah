---
id: T35
title: Audit logging for sensitive actions
phase: 9
status: done
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T03:00:00Z
completed: 2026-09-06T03:35:00Z
updated: 2026-09-05
outcome: |
  migration 0010_audit_log: audit_log (masjid_id, actor_user_id, actor_role,
  action, target_type, target_id, metadata jsonb, at) + a BEFORE UPDATE OR DELETE
  trigger that raises - append-only at the DB, not just convention. lib/audit.ts:
  recordAudit() (best-effort, never throws) + listAuditEntries() (joins actor
  name). Wired into every mutating admin Server Action: volunteers (add/status/
  departure/reinstate), pods (student add/remove, volunteer set), compliance
  (snapshot saved, report exported), inbox (resolve/reopen), seerah (contribution
  added / incorporated), barakah (note added), continuity (briefing / session
  note); handoff-demo departures + volunteer sets are logged with metadata
  {simulation:true}. /admin/audit page (admin-gated) renders the trail with
  human-readable action labels; added to the admin sidebar nav. 5 illustrative
  seed rows in supabase/seed.sql + scripts/seed.ts. check-integrity.ts gained
  check 11: a negative test that UPDATE + DELETE on audit_log are both rejected -
  verified live (both REJECTED). No PII beyond ids. build + lint + tsc + 38
  tests + check:integrity green; page verified live (renders trail; parent
  redirected off it).
commits: <t35>
depends_on: [T30]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Judges will ask 'who can change what and is it recorded'. Pod assignments, volunteer
departures, compliance snapshots, report exports, fee-status changes should leave a trail.

## Done when
- [x] audit_log table (actor, action, target, masjid_id, at, metadata)
- [x] Every admin Server Action writes an entry; an admin-only view to read the trail
- [x] Entries are append-only; no PII beyond ids + action names
      (append-only enforced by DB trigger; no fee-status write action exists yet -
      that table is seed-only, so nothing to log there)

## Notes (owner appends)
