# BOARD — Suffa progress snapshot

**Derived from `progress/tasks/`. Not authoritative. Regenerate after any claim/finish.**
Last regenerated: 2026-09-05 (T17 done - ALL 24 tasks complete)

| id  | phase | status | owner | title |
|-----|-------|--------|-------|-------|
| T01 | 1 | done  | — | Next.js + Tailwind scaffold |
| T02 | 1 | done  | — | Supabase project — Postgres + Auth |
| T03 | 1 | done  | — | Core schema migration |
| T04 | 1 | done  | — | Three route groups + role-gated auth |
| T05 | 2 | done  | — | lib/ai/lesson.ts — generate + persist lesson nodes |
| T06 | 2 | done  | — | Student playground — render lesson, mark complete |
| T07 | 2 | done  | — | lib/ai/checkpoint.ts — checkpoint gen/grade, gate progression |
| T08 | 3 | done  | — | lib/ai/assessment.ts — unit assessment |
| T09 | 3 | done  | — | Term exam variant (timed) + term_exam_results |
| T10 | 4 | done  | — | Parent dashboard — progress + results per course |
| T11 | 4 | done  | — | Admin dashboard — pods, assignment, continuity view |
| T12 | 4 | done  | — | Compliance report generation + exportable view |
| T13 | 5 | done  | — | waqf_ledger table + mock entries |
| T14 | 5 | done  | — | Admin ledger view + family fee status |
| T15 | 6 | done  | — | Volunteer onboarding form + churn log |
| T16 | 6 | done  | — | Regulation-verification disclaimers |
| T17 | 6 | done  | — | Seed data cleanup for demo walkthrough |
| T18 | 7 | done  | — | Continuity Fingerprint — AI volunteer-handoff briefing |
| T19 | 7 | done  | — | Live "empty seat" handoff simulation (demo feature) |
| T20 | 7 | done  | — | Compliance report as a living document (early-warning) |
| T21 | 7 | done  | — | Waqf-to-outcome linking (donor sees learning) |
| T22 | 7 | done  | — | Multi-generational knowledge sourcing for Seerah content |
| T23 | 7 | done  | — | Pod "Barakah meter" — character/community indicators |
| T24 | 7 | done  | — | Waqf principal "never touched" visual |

## Status: all 24 hackathon tasks done.

Get a clean demo state: `npm run demo:setup` (full, hits the API) or `npm run demo:reset`
(state only, seconds). Then `npm run dev`. Walkthrough is in TASKS.md ("Demo script").

## Post-hackathon roadmap — T25–T66 (analysis in `docs/roadmap.md`)

| id  | phase | status | owner | title |
|-----|-------|--------|-------|-------|
| T25 | 8 | doing | session_01SKEyp | Full UI/UX redesign — warm community design system |
| T26 | 8 | done  | — | Pitch one-pager + unit-economics model |
| T27 | 8 | todo  | — | Deploy to Vercel (staging + prod) |
| T28 | 8 | todo  | — | Recorded demo walkthrough (video / GIF) |
| T29 | 8 | todo  | — | Public landing / marketing page |
| T30 | 9 | todo  | — | Replace dev-cookie auth with Supabase Auth |
| T31 | 9 | todo  | — | Postgres RLS policies per table |
| T32 | 9 | todo  | — | Volunteer logins + delegated pod access |
| T33 | 9 | todo  | — | Platform super-admin + masjid provisioning |
| T34 | 9 | todo  | — | Rate limiting + abuse guards on AI endpoints |
| T35 | 9 | todo  | — | Audit logging for sensitive actions |
| T36 | 10 | todo | — | Quebec Law 25 baseline (privacy) |
| T37 | 10 | todo | — | Parental consent flow for minors |
| T38 | 10 | todo | — | Terms of Service / Privacy Policy / AUP |
| T39 | 10 | todo | — | Canadian data residency + data map |
| T40 | 10 | todo | — | Quebec home-instruction regulation: real citations |
| T41 | 10 | todo | — | Content moderation + child safety for UGC |
| T42 | 11 | todo | — | Adaptive path: remediation branch + skip-ahead |
| T43 | 11 | todo | — | Prerequisite / skill-tree mapping |
| T44 | 11 | todo | — | Spaced-repetition review deck |
| T45 | 11 | todo | — | AI lesson tutor (grounded Q&A) |
| T46 | 11 | todo | — | Next-step recommendations |
| T47 | 11 | todo | — | Pod discussion / Q&A board |
| T48 | 11 | todo | — | Enrichment-session attendance tracking |
| T49 | 11 | todo | — | Term-completion record / transcript export |
| T50 | 11 | todo | — | Admin course-authoring UI |
| T51 | 11 | todo | — | Question bank management + item analytics |
| T52 | 11 | todo | — | Consistency indicator (habit, not points) |
| T53 | 12 | todo | — | Error + uptime + performance monitoring |
| T54 | 12 | todo | — | CI: lint + typecheck + build + tests on every PR |
| T55 | 12 | todo | — | Automated tests for the core loop |
| T56 | 12 | todo | — | AI spend monitoring + budget alerts + metering |
| T57 | 12 | todo | — | Backup / restore runbook + integrity check |
| T58 | 12 | todo | — | Transactional email service |
| T59 | 13 | todo | — | French (Quebec) localization |
| T60 | 13 | todo | — | Accessibility pass to WCAG 2.2 AA |
| T61 | 13 | todo | — | PWA + offline: download a unit, work offline, sync |
| T62 | 13 | todo | — | Mobile / responsive audit |
| T63 | 13 | todo | — | Multi-masjid onboarding + per-masjid content library |
| T64 | 13 | todo | — | Learning analytics dashboard |
| T65 | 13 | todo | — | Define + instrument the core metrics |
| T66 | 13 | todo | — | Cognitive-accessibility "simple mode" for the playground |

Pilot order: T26 → T27, then T30 → T31 → T36 → T37 → T38, then T55 → T54 → T53,
then T59 → T60, then Phase 11 depth; T63 is the multi-masjid scale unlock.

## Legend
todo = free to claim · doing = owned now · blocked = see task's `blocker:` · done = see task's `outcome:`
