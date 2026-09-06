# BOARD — Suffa progress snapshot

**Derived from `progress/tasks/`. Not authoritative. Regenerate after any claim/finish.**
Last regenerated: 2026-09-06 (T80 done — authed reads)

## Open tasks (unclaimed, deps met — pick one)

| id  | phase | title | notes |
|-----|-------|-------|-------|
| T59 | 13 | French (Quebec) localization | **partially done** — see the task's "PICK UP HERE" section; compliance screen is the highest-value remaining piece |
| T47 | 11 | Pod discussion / Q&A board | dep T32 done; adds UGC → T41 moderation follows |
| T60 | 13 | Accessibility pass to WCAG 2.2 AA | dep T25 done; large, partly needs a human (screen-reader passes) |

| T81 | 13 | Per-masjid curriculum — adopt shared or fork/author | dep T50 done, **T63 done** (frontmatter was stale) |
| T41 | 10 | Content moderation + child safety for UGC | blocked on T47 |
| T27 T28 T53 T58 T76 T78 | — | deploy / demo recording / monitoring / email / rehearsal / mock Q&A | infra + delivery, mostly not pure-code |


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
| T25 | 8 | done  | — | Full UI/UX redesign — warm community design system |
| T26 | 8 | done  | — | Pitch one-pager + unit-economics model |
| T27 | 8 | todo  | — | Deploy to Vercel (staging + prod) |
| T28 | 8 | todo  | — | Recorded demo walkthrough (video / GIF) |
| T29 | 8 | done  | — | Public landing / marketing page |
| T30 | 9 | done  | — | Real auth - sign-up/sign-in + 3 demo accounts |
| T31 | 9 | done  | — | Postgres RLS policies per table |
| T32 | 9 | done  | — | Volunteer logins + delegated pod access |
| T33 | 9 | done  | — | Platform super-admin + masjid provisioning |
| T34 | 9 | done  | — | Rate limiting + abuse guards on AI endpoints |
| T35 | 9 | done  | — | Audit logging for sensitive actions |
| T36 | 10 | done | — | Quebec Law 25 baseline (privacy) |
| T37 | 10 | done | — | Parental consent flow for minors |
| T38 | 10 | done | — | Terms of Service / Privacy Policy / AUP |
| T39 | 10 | done | — | Canadian data residency + data map |
| T40 | 10 | done | — | Quebec home-instruction regulation: real citations |
| T41 | 10 | todo | — | Content moderation + child safety for UGC |
| T42 | 11 | done | — | Adaptive path: remediation branch + skip-ahead |
| T43 | 11 | done | — | Prerequisite / skill-tree mapping |
| T44 | 11 | done | — | Spaced-repetition review deck |
| T45 | 11 | done | — | AI lesson tutor (grounded Q&A) |
| T46 | 11 | done | — | Next-step recommendations |
| T47 | 11 | todo | — | Pod discussion / Q&A board |
| T48 | 11 | done | session_01KZau4 | Enrichment-session attendance tracking |
| T49 | 11 | done | — | Term-completion record / transcript export |
| T50 | 11 | done | — | Admin course-authoring UI |
| T51 | 11 | done | — | Question bank management + item analytics |
| T52 | 11 | done | — | Consistency indicator (habit, not points) |
| T53 | 12 | todo | — | Error + uptime + performance monitoring |
| T54 | 12 | done | — | CI: lint + typecheck + build + tests on every PR |
| T55 | 12 | done | — | Automated tests for the core loop |
| T56 | 12 | done | — | AI spend monitoring + budget alerts + metering |
| T57 | 12 | done | — | Backup / restore runbook + integrity check |
| T58 | 12 | todo | — | Transactional email service |
| T59 | 13 | todo | — | French (Quebec) localization — SEE the task's "PICK UP HERE": framework + switch + landing + chrome + student path + parent home + 4/5 demo-path admin screens done (486 keys); compliance screen + remaining admin sub-pages + FR generated content + native review left |
| T60 | 13 | todo | — | Accessibility pass to WCAG 2.2 AA |
| T61 | 13 | done | — | PWA + offline: download a unit, work offline, sync |
| T62 | 13 | done | — | Mobile / responsive audit |
| T63 | 13 | done | — | Multi-masjid onboarding + per-masjid content library |
| T64 | 13 | done | — | Learning analytics dashboard |
| T65 | 13 | done | — | Define + instrument the core metrics |
| T66 | 13 | todo | — | Cognitive-accessibility "simple mode" for the playground |

Pilot order: T26 → T27, then T30 → T31 → T36 → T37 → T38, then T55 → T54 → T53,
then T59 → T60, then Phase 11 depth; T63 is the multi-masjid scale unlock.

## Phase 14 — MuslimHacks judging-rubric prep (Business 40 / Technical 30 / Delivery 30)

| id  | phase | status | owner | title |
|-----|-------|--------|-------|-------|
| T67 | 14 | done | — | One well-defined problem slice, stated plainly (Business) |
| T68 | 14 | done | — | Cost-of-running + sustainability argument, defensible (Business) |
| T69 | 14 | done | — | Documented market/competitor research (Business) |
| T70 | 14 | done | — | Plain-language "what is this" explainer (Business) |
| T71 | 14 | done | — | Architecture: legible + justified (Technical-sw) |
| T72 | 14 | done | session_01KZau4 | Cohesion / coupling / readability pass (Technical-sw) |
| T73 | 14 | done | — | Performance check + notes (Technical-sw) |
| T74 | 14 | done | — | Test coverage: measure it, report the number (Technical-sw) |
| T75 | 14 | done | — | Design-decision log — how we arrived at this (Technical) |
| T76 | 14 | todo | — | Demo rehearsal + fallback recording + walkthrough script (Delivery) |
| T77 | 14 | done | — | Judge Q&A prep bank — drafted answers (Delivery) |
| T78 | 14 | todo | — | Mock Q&A round (Delivery) |

`docs/qa-prep.md` is drafted (T77). Team/process answers in it need the team to fill.

## Follow-on tasks (split from a parent during the build)

| id  | phase | status | owner | title |
|-----|-------|--------|-------|-------|
| T79 | 9 | done | — | RLS write policies (0017) + parent/analytics reads on the authed client; rest of lib/db → T80 |
| T80 | 9 | done | — | Finish moving user-facing lib/db reads onto getReadClient() (rest → T82) |
| T82 | 9 | todo | — | RLS: newer read files + move user-action writes off service-role (from T80) |

## Legend
todo = free to claim · doing = owned now · blocked = see task's `blocker:` · done = see task's `outcome:`
