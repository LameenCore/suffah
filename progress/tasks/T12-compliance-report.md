---
id: T12
title: Compliance report generation + exportable view
phase: 4
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: [T08, T11]
outcome: lib/compliance/{status,report}.ts + ComplianceReportView. /admin/compliance
  (live report + save snapshot to compliance_reports + printable /[studentId]/print),
  /parent/compliance. POST /api/reports/generate. Built together with T20 (living
  status). npm run seed:progress for demo data. Verified.
commits: 7ab3e4b, <t12t20>
---

## Goal
Aggregate a student's checkpoint + assessment + exam results into a compliance_reports
record; render a basic exportable / printable view with the regulation disclaimer (T16).

## Done when
- [x] compliance_reports record generated from real result data
- [x] Printable / exportable report view
- [x] Regulation disclaimer visible on the report

## Notes (owner appends)
- Built together with **T20** — the report is a living view from the start; the snapshot
  (`compliance_reports` row) is a point-in-time capture of it, `exported` flag included.
- Reuses `lib/db/parent-queries.ts::getChildReport` (T10) for the raw evidence gather.
- `lib/compliance/status.ts` is pure (no I/O) — per-course on_track/watch/gap + signals.
- Print: `/admin/compliance/[studentId]/print` (new tab, browser print). No PDF lib.
