# BOARD — Suffa progress snapshot

**Derived from `progress/tasks/`. Not authoritative. Regenerate after any claim/finish.**
Last regenerated: 2026-09-05 (T13 done; T07 done — Phase 2 milestone)

| id  | phase | status | owner | title |
|-----|-------|--------|-------|-------|
| T01 | 1 | done  | — | Next.js + Tailwind scaffold |
| T02 | 1 | done  | — | Supabase project — Postgres + Auth |
| T03 | 1 | done  | — | Core schema migration |
| T04 | 1 | done  | — | Three route groups + role-gated auth |
| T05 | 2 | done  | — | lib/ai/lesson.ts — generate + persist lesson nodes |
| T06 | 2 | done  | — | Student playground — render lesson, mark complete |
| T07 | 2 | done  | — | lib/ai/checkpoint.ts — checkpoint gen/grade, gate progression |
| T08 | 3 | todo  | — | lib/ai/assessment.ts — unit assessment |
| T09 | 3 | todo  | — | Term exam variant (timed) + term_exam_results |
| T10 | 4 | todo  | — | Parent dashboard — progress + results per course |
| T11 | 4 | done  | — | Admin dashboard — pods, assignment, continuity view |
| T12 | 4 | todo  | — | Compliance report generation + exportable view |
| T13 | 5 | done  | — | waqf_ledger table + mock entries |
| T14 | 5 | todo  | — | Admin ledger view + family fee status |
| T15 | 6 | todo  | — | Volunteer onboarding form + churn log |
| T16 | 6 | todo  | — | Regulation-verification disclaimers |
| T17 | 6 | todo  | — | Seed data cleanup for demo walkthrough |

## Next up (deps met, unclaimed)
- **T14** — Admin ledger view + family fee status (deps T13, T11 done)
- **T08** — lib/ai/assessment.ts — unit assessment (dep T07 done)
- **T10** — Parent dashboard — progress + results per course (deps T07, T11 done)
- **T15** — Volunteer onboarding form + churn log (dep T11 done)
- **T16** — regulation disclaimers (no deps, can run anytime)
- blocked: T09 (needs T08), T12 (needs T09, T10)

## Legend
todo = free to claim · doing = owned now · blocked = see task's `blocker:` · done = see task's `outcome:`
