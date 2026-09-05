---
id: T57
title: Backup / restore runbook + integrity check
phase: 12
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Losing a term of student results before a compliance deadline is the worst case. Document
and test recovery.

## Done when
- [ ] Confirm Supabase PITR is on; write a restore runbook (RTO/RPO stated) and do one test
      restore
- [ ] A scheduled data-integrity script: orphaned rows, pods over the 4-cap, results without
      a student, principal summed anywhere it shouldn't be
- [ ] Findings alert; the script is part of CI's nightly run

## Notes (owner appends)
