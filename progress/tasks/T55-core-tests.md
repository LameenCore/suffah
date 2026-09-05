---
id: T55
title: Automated tests for the core loop
phase: 12
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Zero automated tests today. The lesson -> checkpoint -> advance loop, objective grading, and
compliance-status computation are the parts that must not silently break.

## Done when
- [ ] Unit tests: gradeQuestion / gradeQuestions (all question types, missing answers,
      tolerance), computeCourseStatus, ledger aggregation (principal never counted)
- [ ] Integration tests against a test Supabase schema: mark lesson complete -> checkpoint
      -> pass -> pod_progress advances; cross-tenant access refused
- [ ] Runs headless in CI; a documented `npm test`

## Notes (owner appends)
