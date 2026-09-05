# Post-hackathon roadmap

The 24 build tasks + Phase 7 differentiators are done. T25 (UI/UX redesign) is in
flight. This file records what a full SaaS-EdTech feature map looks like *filtered
to Suffa's actual context*, and the reasoning for what is in, deferred, or out.
The individual work items are `progress/tasks/T26+.md`.

## Suffa's context (the filter)

- **Non-profit, waqf-funded, free to families.** No marketplace, no instructor
  revenue-share, no CAC/LTV acquisition funnel, no paid ads. The "business
  model" is the waqf endowment + a flat permanent fee + sadaqah scholarships,
  and it is already built (T13/T14/T21).
- **Quebec Muslim homeschool pods, minors 10-13.** French localization and
  Quebec Law 25 (privacy) are real requirements, not GDPR/CCPA-first. Home-
  instruction regulation is the credibility pillar.
- **AI carries instruction; volunteers do in-person enrichment.** No live-class
  video, no scheduling-heavy virtual classroom. The platform is asynchronous and
  self-paced inside a shared pod topic.
- **Objective grading only** (PRD non-goal: no rubric/subjective). Question bank
  and item analytics are in; webcam/lockdown proctoring and plagiarism detection
  are out (inappropriate for a homeschool trust model with minors).
- **Community ethos, deliberately anti-leaderboard** (see T23). Any streak /
  habit feature must never rank students or award prizes.
- **Masjid is the top tenant.** No district->school->classroom hierarchy, no SIS
  integration. Multi-masjid onboarding matters; enterprise sales motion does not.

## Roadmap phases

| Phase | Theme | Tasks |
|---|---|---|
| 8 | Pitch, deploy, present | T25 (UI), T26 pitch one-pager, T27 Vercel deploy, T28 demo recording, T29 marketing site |
| 9 | Real auth & access | T30 Supabase Auth, T31 RLS, T32 volunteer logins, T33 super-admin, T34 AI rate-limit, T35 audit log |
| 10 | Data protection & Quebec compliance | T36 Law 25 baseline, T37 parental consent, T38 legal pages, T39 data residency, T40 Quebec regs (real citations), T41 UGC moderation |
| 11 | EdTech product depth | T42 adaptive path, T43 skill tree, T44 spaced repetition, T45 AI lesson tutor, T46 recommendations, T47 pod discussion, T48 attendance, T49 transcript, T50 authoring UI, T51 question bank, T52 consistency indicator |
| 12 | Reliability & ops | T53 monitoring, T54 CI, T55 core-loop tests, T56 AI spend metering, T57 backup runbook, T58 email service |
| 13 | i18n, a11y, scale | T59 French l10n, T60 WCAG 2.2 AA, T61 PWA/offline, T62 responsive audit, T63 multi-masjid, T64 analytics dashboard, T65 metrics, T66 simple mode |

Rough priority for a real pilot: **T26 -> T27** (present it), then **T30 -> T31 ->
T36 -> T37 -> T38** (you cannot onboard a real family without auth + consent +
Law 25 + legal pages), then **T55 -> T54 -> T53** (stop shipping regressions),
then **T59 -> T60** (French + accessible or it can't operate in Quebec), then the
Phase 11 product depth as capacity allows. T63 (multi-masjid) is the scale
unlock once one masjid is running well.

## Explicitly out of scope (and why)

| Checklist item | Why not |
|---|---|
| Marketplace, instructor revenue-share, seat-based B2B pricing | Free to families; waqf-funded; no instructor economy |
| Real payment processing / dunning / chargebacks | PRD non-goal (mocked ledger). A real Interac/Stripe rail for the flat fee + CRA charitable receipts for sadaqah is a *later* pilot task, not roadmapped yet |
| Webcam proctoring, browser lockdown, plagiarism detection | Inappropriate for minors in a homeschool trust model; grading is objective anyway |
| Rubric / subjective AI grading | PRD non-goal |
| Live-class video, WebRTC, breakout rooms, virtual whiteboard | Volunteers enrich in person; the thesis is AI carries instruction |
| SIS integration, district/school hierarchy, LTI to Canvas/Moodle | Homeschool; masjid is the top tenant. LTI export could return if school boards ask |
| Native iOS/Android apps | PWA (T61) covers the need; a hackathon-stage non-profit should not run app-store pipelines |
| SOC 2, enterprise security questionnaires, SLA commitments | No enterprise buyer. Law 25 + a written data map (T36/T39) is the right bar |
| Paid acquisition, affiliate programs, SEO-farm content | Non-profit; growth is via masjid partnerships (folded into T29/T63) |
| Elasticsearch, microservices, video transcoding, IaC | Over-engineering for the scale; Next.js + Supabase + Vercel is sufficient through many masjids |
| Team/org/hiring plan | Not a software task; belongs in the pitch appendix (T26) |
