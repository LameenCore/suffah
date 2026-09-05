---
id: T57
title: Backup / restore runbook + integrity check
phase: 12
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-05T22:20:00Z
completed: 2026-09-05T22:45:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: docs/ops/backup-restore.md - backup layers (PITR + daily snapshot + a nightly
  off-Supabase encrypted pg_dump to build with T54), RPO <=5min / RTO <=2h, three restore
  procedures (PITR for a bad write, dump for a Supabase-side loss, gen:* for content-only),
  a quarterly test-restore procedure, and a log. scripts/check-integrity.ts +
  `npm run check:integrity` - 10 checks FKs don't enforce (cross-tenant refs, pod > 4-cap,
  pod_progress node in the wrong course, ledger sign errors, results for a student in no
  pod, departed volunteer still assigned, roles). Exit 1 on any FAIL. Verified against the
  live DB: all pass; negative-tested (a wrong-sign ledger row -> FAIL, exit 1).
commits: <t57>
---

## Why
Losing a term of student results before a compliance deadline is the worst case. Document
and test recovery.

## Done when
- [x] Restore runbook with RPO <=5min / RTO <=2h and three procedures; PITR-status
      confirmation + the first real test restore need the Supabase dashboard (flagged in
      the runbook log - can't do from here)
- [x] scripts/check-integrity.ts - 10 checks: pod cap, cross-tenant pod membership,
      pod_progress/unit course match, checkpoint_results tenant match, parent_children
      roles, departed-volunteer assignment, waqf sign convention, results for non-pod
      students, compliance_reports target. Read-only, exit 1 on FAIL.
- [x] Documented as a nightly CI step (T54) + a step in every restore; alert = exit 1

## Notes (owner appends)
- scripts/ + docs/ only; no app/ or components/ touched (T25).
- Verified live: all 10 pass on the demo DB; inserted a return_disbursed row with a
  positive amount -> the sign check FAILs and the script exits 1; removed it -> clean.
- The nightly encrypted off-Supabase dump is specified but not wired - it belongs in
  T54's GitHub Actions nightly job.
