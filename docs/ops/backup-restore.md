# Backup & restore runbook

_Task T57. The worst case is losing a term of student results before a Quebec
compliance deadline. This is how we prevent that and recover if it happens._

## What must survive

Everything in Postgres: identity, pods, results (`checkpoint_results`,
`unit_assessment_results`, `term_exam_results`, `lesson_progress`),
`compliance_reports`, the continuity trail, `waqf_ledger`. The **generated
curriculum** (`pathway_nodes.lesson_content` / `.checkpoint_content`,
`term_exams`, briefings) is also in Postgres, so it's covered — and if lost it
can be rebuilt with the `gen:*` scripts for a few dollars. The irreplaceable data
is the per-student results and the compliance snapshots.

## Backup layers

| Layer | Mechanism | Cadence | Retention | Confirm |
|---|---|---|---|---|
| **Point-in-time recovery (PITR)** | Supabase WAL archiving | continuous | plan-dependent (7 days on Pro; longer add-on) | **Dashboard → Database → Backups → confirm PITR is ON and note the window.** PITR needs at least the Pro plan. |
| **Daily logical backup** | Supabase automatic daily snapshot | daily | plan-dependent | Confirm in the same panel. |
| **Off-Supabase copy** | `pg_dump` to encrypted object storage in the DB's region | nightly (scheduled — see below) | 30 days rolling + 1 monthly kept 1 year | Not set up yet — build with T54's CI nightly job. |

Two independent providers is the point: PITR/snapshots protect against our
mistakes; the off-Supabase dump protects against a Supabase-side loss or an
account problem.

### Nightly off-Supabase dump (to build)

```bash
# runs in CI nightly (GitHub Actions) or a small scheduled worker
pg_dump "$SUPABASE_DB_URL" --format=custom --no-owner --no-privileges \
  | age -r "$BACKUP_AGE_PUBLIC_KEY" \
  > "suffa-$(date -u +%Y%m%dT%H%M%SZ).dump.age"
# upload to a bucket in the SAME region as the DB (ca-central-1 once migrated - T39)
```

Keep the `age`/GPG private key **out** of CI — only the public key is needed to
write backups; restoring is a deliberate, human-in-the-loop action.

## Targets

| Metric | Target | Rationale |
|---|---|---|
| **RPO** (max data loss) | **≤ 5 minutes** | PITR is continuous; the exposure is only the WAL not yet archived. |
| **RTO** (time to restore) | **≤ 2 hours** | PITR restore into a fresh project + swap env vars + run the integrity check. |
| Off-Supabase dump RPO | ≤ 24 h | The dump is the fallback-of-last-resort, not the primary. |

## Restore procedures

### A. Recover from an accidental bad write / deletion (most likely) — use PITR

1. **Stop writes.** Set the app to maintenance (or scale the deployment to zero)
   so nothing new lands while you work.
2. In the Supabase dashboard, **Database → Backups → Point in time**, pick a
   timestamp **just before** the bad change. Supabase restores into a **new
   project** (it does not overwrite in place).
3. Wait for the new project to provision.
4. **Verify** the new project: `SUPABASE_DB_URL=<new> npm run check:integrity`
   and spot-check the affected rows.
5. Repoint env vars (the four Supabase vars) in every environment to the new
   project. Redeploy.
6. Delete or quarantine the old project once the new one is confirmed good.
7. Write an incident note: what changed, when, blast radius, the timestamp
   restored to.

### B. Supabase-side loss / account problem — use the off-Supabase dump

1. Create a **new Supabase project in `ca-central-1`** (T39).
2. `npm run migrate` against it (creates the schema).
3. Decrypt and restore the most recent dump:
   ```bash
   age -d -i backup-key.txt suffa-<ts>.dump.age > suffa.dump
   pg_restore --no-owner --no-privileges --dbname "$NEW_DB_URL" suffa.dump
   ```
4. `npm run check:integrity` against the new project.
5. Repoint env vars, redeploy, incident note.

### C. Curriculum content only was lost (low severity)

`npm run gen:lessons && npm run gen:checkpoints && npm run gen:assessments &&
npm run gen:exams` — regenerates and persists. Costs a few dollars of API time.
Student results are untouched.

## Test-restore procedure (do this quarterly, and once now)

A backup you have never restored is a hope, not a backup.

1. Trigger a **PITR restore to a throwaway project** at "now − 1 hour".
2. Run `SUPABASE_DB_URL=<throwaway> npm run check:integrity` — expect all pass.
3. Run `SUPABASE_DB_URL=<throwaway> npm run seed` is **not** needed — the point is
   to confirm the *restored* data is intact, not to reseed.
4. Compare row counts of the key tables (`users`, `pod_students`,
   `checkpoint_results`, `unit_assessment_results`, `term_exam_results`,
   `compliance_reports`) against the live project — they should match minus the
   last hour of activity.
5. Delete the throwaway project.
6. Record the date, the measured RTO, and any surprises in this file's log below.

## Integrity monitoring

`scripts/check-integrity.ts` (`npm run check:integrity`) checks what foreign keys
do not: cross-tenant references, pods over the 4-student cap, `pod_progress`
nodes in the wrong course, ledger sign errors, results for students in no pod,
departed volunteers still assigned. **Exit 1 on any failure.**

- Run it **nightly in CI** (T54) against production; alert on exit 1.
- Run it as **step 4 of every restore**.
- Run it after any bulk data operation (a new masjid import, a migration that
  touches data).

## Log

| Date | Action | RTO measured | Notes |
|---|---|---|---|
| _2026-09-05_ | runbook written; `check:integrity` built + verified (catches a bad row, passes clean) against the live demo DB | — | PITR status not yet confirmed — needs the Supabase dashboard. Nightly off-Supabase dump not yet built (blocked on T54 CI). |
