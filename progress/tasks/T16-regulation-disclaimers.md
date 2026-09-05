---
id: T16
title: Regulation-verification disclaimers
phase: 6
status: done
owner: https://claude.ai/code/session_01SKEypdSNQf7yjj5E411g4B
claimed: 2026-09-05T00:00:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
depends_on: []
outcome: Audited every route for regulatory claims (exemption threshold / evaluation
  format / exam equivalency / curriculum alignment). Added page-level RegulationNote to
  /admin/compliance and /parent/compliance; the rest were already covered (some via
  ComplianceReportView / LessonView which carry the note).
commits: 8a8ee2d, <t16>
---

## Goal
Hard PRD constraint: any compliance / legal-adjacent screen (exemption thresholds,
evaluation formats) must show a visible "verify with current regulation" note.
components/RegulationNote.tsx already exists — wire it everywhere it belongs.

## Done when
- [x] RegulationNote shown on every compliance/legal-adjacent screen

## Notes (owner appends)
Audit (2026-09-05):
| screen | regulatory claim | note |
|---|---|---|
| /admin/pods | 4-student exemption cap | ✓ |
| /student | assessment formats | ✓ |
| /student/[c]/exam | exam equivalency | ✓ |
| /student/[c] (Math lesson) | Québec Sec-1 curriculum alignment | ✓ via LessonView |
| /admin | report format | ✓ |
| /admin/compliance | evaluation requirement | ✓ added |
| /admin/compliance/[s]/print | full record | ✓ via ComplianceReportView |
| /parent/compliance | evaluation requirement | ✓ added |
| /admin/ledger, /admin/volunteers, /admin/barakah, /admin/seerah, / | none (checked) | n/a |
