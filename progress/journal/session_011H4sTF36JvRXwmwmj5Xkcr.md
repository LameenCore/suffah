# Journal — session_011H4sTF36JvRXwmwmj5Xkcr

Session URL: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
Started: 2026-09-05

Append-only. Only this session writes here.

---

## 2026-09-05 — claimed T11 (Admin dashboard — pods, assignment, continuity view)
Read CLAUDE.md, AGENTS.md, ARCHITECTURE.md, DATA_MODEL.md, api-design.md, git-workflow.md,
progress/README.md, Next 16 mutating-data doc. Reviewed existing app/admin, lib/auth,
lib/db, lib/db/queries.ts, supabase/migrations/0001_init.sql + seed.sql, shared components.

T07 was the critical-path pick but its deps include T06 (still `doing` by another session),
so it's not eligible. T11's only dep is T04 (done). Picked T11 — no file overlap with the
T06 owner (they're in /student), and it unblocks T12/T14/T15.

Note: `.env.local` is not present in this checkout, so no live Supabase/Anthropic. Building
T11 to the same standard as T05 (typechecks + builds; runs when Supabase is configured).
Verification here = `next build` + `eslint` + `tsc --noEmit`.

Plan:
- lib/db/queries.ts — add masjid-scoped reads: pods w/ volunteer + students + counts,
  courses, student users, volunteers, pod_progress continuity (pod x course -> current node).
- lib/pods/assign.ts — assignment ops: add/remove student (hard cap 4, one pod per student,
  tenancy checks), assign/clear volunteer. DB trigger already enforces the cap; mirror it in
  app code so the UI can show a clean error instead of a 500.
- app/admin/pods/page.tsx — server component: pod cards (volunteer select, student list w/
  remove, add-student select) + continuity matrix (pods x 3 courses).
- app/admin/pods/actions.ts — "use server", requireRole('admin') + masjid scoping,
  revalidatePath('/admin/pods').
- app/admin/page.tsx — point the "Pods" card at /admin/pods.
- RegulationNote on the pods page for the 4-student cap.

## 2026-09-05 — BUG: `next build` red on main (pg deps declared, not installed)
The T06 wip commit f6f676a added `pg` + `@types/pg` to package.json and `scripts/migrate.ts`,
but this checkout's node_modules didn't have them, so `next build` failed type-checking
migrate.ts (TS2307 cannot find 'pg', TS7006 implicit any). Root fix: `npm install`. That
also reconciled the pre-existing `M package-lock.json` (npm-version `libc`-field churn on
optional platform packages — cosmetic). Folded the lockfile change into the T11 commit
rather than a separate one (hackathon git-workflow: lockfile hygiene not worth the churn).

## 2026-09-05 — T11 done
- lib/db/admin-queries.ts — masjid-scoped: listPods (volunteer + members + per-course
  continuity), listVolunteers, listStudents (with current pod), and writes addStudentToPod
  / removeStudentFromPod / setPodVolunteer. addStudentToPod enforces tenancy + the
  POD_MAX_STUDENTS cap + one-pod-per-student, all with human-readable errors; the DB
  trigger from 0001 stays as the backstop.
- app/admin/pods/actions.ts — "use server", requireAdmin() on every action, masjid taken
  from the session (never the client). Actions return {ok,error} so cap violations render
  inline instead of throwing the Next error overlay. revalidatePath('/admin/pods').
- components/admin/PodCard.tsx — client: volunteer <select>, student roster with remove,
  add-student <select>+button (disabled when full / nothing to add), inline error line.
- app/admin/pods/page.tsx — pod cards grid + continuity matrix (pods x 3 courses, cell =
  "node N / total" + title). try/catch around the loads → friendly panel when Supabase
  isn't configured. RegulationNote on the 4-student cap.
- app/admin/page.tsx — "Pods" card is now a live link to /admin/pods (kept the other 3
  as stubs).
- Verified: `next build` green (route ƒ /admin/pods listed), `eslint` clean. Not run
  against a live DB (no .env.local here). Commit 3a42a5b.
- Left T07 alone (dep T06 still doing). Next free tasks: T13, T16.

## 2026-09-05 — claimed T13 (waqf_ledger table + mock entries)
Table already exists in 0001_init.sql; seed.sql + scripts/seed.ts already insert 6 ledger
rows + 4 family_fee_status rows. T13 is mostly satisfied — plan is to verify + enrich the
mock ledger into a fuller ~15-month quarterly series so T14's "principal flat vs return
spent" chart has real shape, keeping supabase/seed.sql and scripts/seed.ts in exact sync.
No new migration needed. Commit the claim, then the data.

## 2026-09-05 — T13 done
Enriched the mock waqf_ledger to 11 rows over ~15 months in both supabase/seed.sql and
scripts/seed.ts (kept identical): 1 locked principal deposit (250k), 5 rising quarterly
return_disbursed operating draws (-3000..-3600), 3 sadaqah_received (Eid 2k, Ramadan 5k,
aggregated jumu'ah 1.2k), 2 scholarship_allocated (Safiya term 1 + 2, -1200 each).
No new migration (table is in 0001_init.sql). build + lint green. Not run against a live
DB. Commit c6d3abb. Next: T16.

## 2026-09-05 — T14 done
- lib/db/ledger-queries.ts — getLedgerSummary (principal / returns / sadaqah / scholarships
  as separate lines; principal never in a "spent" total per DATA_MODEL) + cumulative-out
  spendSeries; getFamilyFeeStatus (masjid-scoped, sorted).
- components/admin/LedgerChart.tsx — client, inline SVG. Single y-axis 0..principal, one
  area+line series (cumulative money out), dashed principal reference line, direct label
  on last point, hover crosshair + tooltip. dataviz palette validator PASS light+dark
  (#2a78d6 / #3987e5).
- app/admin/ledger/page.tsx — 4 stat tiles + chart + table-view <details> + family fee
  list w/ paying/scholarship counts + mock-data disclaimer. try/catch -> friendly panel
  when Supabase unconfigured.
- app/admin/page.tsx — "Waqf & donation ledger" card now links to /admin/ledger.
- build + lint green. Not visually verified vs live data (no .env.local). Commit bd9e01e.
- Next free: T10, T15, T16. T08 is taken by the other session.

## 2026-09-05 — T10 done
- BUG/gap: schema had no parent->student link. Root fix: migration 0005_parent_children
  (join table, FK cascade from users) + seed row demo parent b1 -> Yusuf c1 in both
  supabase/seed.sql and scripts/seed.ts. Needs npm run migrate + npm run seed live.
- lib/db/parent-queries.ts — getChildrenForParent (masjid + role guarded) and
  getChildReport: per course -> pod pathway position/total + checkpoint_results,
  unit_assessment_results, term_exam_results lists (all masjid/student scoped).
- app/parent/page.tsx — full rewrite from the stub: one block per child, per-course
  card with a progress bar + three result lists, pass/needs-review badges, dates.
  RegulationNote on evaluation formats. try/catch -> friendly panel when unconfigured.
- Unit/term rows show "None yet" until T08/T09 generation runs.
- build + lint green; not verified vs live data. Commit be5e05a.
- Next free: T15, T16.

## 2026-09-05 — T15 done
- lib/db/volunteer-queries.ts — listVolunteers (active vs churned split, with pod
  coverage), addVolunteer (starts pending_vetting), setVolunteerStatus, recordDeparture
  (stamps left_at + inactive + nulls pods.volunteer_id — pod_progress untouched),
  reinstateVolunteer. All masjid-scoped.
- app/admin/volunteers/actions.ts — "use server", requireAdmin, {ok,error}.
- components/admin/VolunteerManager.tsx — onboarding form + current list (status
  toggles + Record departure) + churn log (tenure, Reinstate).
- app/admin/volunteers/page.tsx + admin home link. Seed gains departed "Sr. Amina"
  so the churn log is non-empty.
- No migration (volunteers table already has status/certification_note/left_at).
- build + lint green; not verified vs live data. Commit cf8920e. Next free: T16.

## 2026-09-05 — T24 done
- components/admin/WaqfFlowDiagram.tsx — inline-SVG "how the waqf works" primer:
  a locked padlock block for the fixed principal + two thin animated streams
  (returns->operations, sadaqah->scholarship pool) that never touch the principal.
  Server component, CSS-var theming (light+dark), pure-CSS dash animation gated by
  prefers-reduced-motion. Wired into /admin/ledger above the time-series chart.
- Principal-never-spendable rule already enforced in getLedgerSummary (T14).
- build + lint green; geometry hand-checked (not rendered live, no .env.local).
- commit 8e8bc04. Session tally: T10,T11,T13,T14,T15,T24.

## 2026-09-05 — T21 done
- migration 0006_sponsorships (sponsor_label, amount, pod_id, unit_id — mock mapping).
  Seeded 3 links (Pod Al-Farabi -> each unit) in supabase/seed.sql + scripts/seed.ts.
- lib/db/sponsorship-queries.ts — getSponsoredOutcomes: joins the mock mapping to REAL
  outcomes (unit completion from pod_progress vs the unit%27s node range; assessment
  pass count from unit_assessment_results for the pod%27s students). Pod-level only,
  no names.
- components/admin/SponsoredOutcomes.tsx (server) + a "Sponsored outcomes" section on
  /admin/ledger, with an "illustrative" disclaimer.
- Supabase typed-select needed an `as unknown as Record<string,unknown>[]` cast (no
  generated DB types in this repo) — same pattern as the other query files.
- build + lint green; not verified vs live data. commit 5c93603.
- Remaining unclaimed in my lane: T22 (mock/text), T23 (build). T18/T19/T20 with the
  other session or blocked on T12.

## 2026-09-05 — T23 done
- migration 0007_pod_barakah_log (pod_id, student_user_id nullable = whole-pod note,
  indicator, note, recorded_by). Seed adds 5 notes.
- lib/db/barakah-queries.ts — BARAKAH_INDICATORS (attendance/cooperation/reflection/
  adab), listBarakahNotes (admin), getChildBarakahSummary (parent: calm phrases +
  recent notes, NO scores/counts as rank), addBarakahNote (tenancy + pod-membership
  checks).
- app/admin/barakah/{page,actions}.ts + components/admin/BarakahCheckIn.tsx — weekly
  check-in form + recent-notes list. Admin home gains a card.
- app/parent/page.tsx — per-child "Character & community" section (phrases + notes).
- Note: 0006 filename collides with the other session's 0006_continuity_fingerprint
  (mine 0006_sponsorships already on main from T21). Migrate runner sorts by full
  filename + tracks each separately, so both apply — cosmetic only, left as-is.
- build + lint green on the merged tree; not verified vs live data. commit 104c9ca.

## 2026-09-05 — T22 done
- migration 0008_lesson_contributions (node_id, contributor_name/role, note,
  incorporated). Seed adds 2 contributions on the Seerah node-1 lesson.
- lib/db/contribution-queries.ts — listSeerahNodes (lesson presence + version +
  pending/incorporated counts), listContributions, addContribution (tenancy via
  node->course->masjid).
- lib/ai/lesson-revision.ts — incorporateContributions(nodeId, masjidId): deterministic
  merge of pending notes into a "Community input" section, bumps
  lesson_content.communityRevision.version, marks contributions incorporated. Model
  rewrite is the productionization step (same persistence/version contract).
- app/admin/seerah/{page,actions}.ts + components/admin/SeerahContributions.tsx —
  node picker (pending badges), draft preview, contributions list, add form,
  "Incorporate N pending -> new version" button. Admin home card.
- No pathway_nodes ALTER (revision metadata rides in the lesson JSON).
- build + lint green on merged tree (other session landed T19). Not verified vs live
  data. commit c6b60df.
- All my lane is now done. Remaining board: T09/T12/T16/T17/T20 — other session or
  blocked on T12.

## 2026-09-05 - post-completion: skills, AI-tell cleanup, audit (user request)
Not a board task - direct user request in 3 parts.

1. Skills created under .claude/skills/ (dir did not exist): research, api-design
   (supersedes root api-design.md), app-verification, security-review (supersedes
   root security-review.md). Committed 19a9706.
2. AI writing tells: used the research skill -> docs/research/ai-writing-tells.md
   (3 sources: Wikipedia Signs-of-AI-writing, SlopDetector, Pangram). Repo's only
   real tell was em-dash overuse in comments (196 across 69 files). Mechanical
   '—'->'-' in lib/app/components/scripts + reworded the ~8 in user-facing prose;
   same pass on root docs, skill files, seed.sql, migration comments. seed.sql was
   out of sync with scripts/seed.ts (the actual seeder) so seeded note values kept
   surfacing em-dashes in the ledger UI - fixed + re-seeded. Also dropped
   gratuitous "AI" self-labelling from UI copy (kept "AI Literacy" course name +
   lib/ai/ paths). Verified: 0 em-dashes, 0 stray "AI" in rendered HTML across all
   13 routes. AGENTS.md left alone (regenerated by next dev).
3. Audit (docs/review/2026-09-05-audit.md): applied security-review + api-design +
   app-verification + an edge-case sweep. Code is defensively written throughout.
   One real tenant gap fixed: markReportExported(reportId) had no masjid check
   (any admin could flip another masjid's report.exported). Also scoped
   getLatestStoredReport and added a UUID guard on the one PostgREST .or() filter.
   5 defense-in-depth / demo-benign items noted. build + lint + all routes green;
   DB re-seeded + regenerated (seed, seed:continuity, seed:progress, gen:*).
Commits: 19a9706, eca5af2, 9da1992, f1cfc7c, 9662c0d, f46ee91, de2fb60, 4f00c9f.

## 2026-09-05 - bug-check + full-file cleanliness pass (user request)
Bugs: the one real bug (markReportExported cross-tenant write) was already fixed
+ pushed. Re-traced findings 4-6 - all confirmed safe (student_user_id filter is
always the session user; getTermExam masjid check sits on the line before the
save; date formatters read NOT NULL columns). Nothing unfixed -> pushed.

Cleanliness sweep of all files:
- moved ARCHITECTURE.md + DATA_MODEL.md into docs/ (18 refs already said docs/);
  fixed the remaining bare refs
- CLAUDE.md file list -> real .claude/skills/ contents; "superseded by" banners on
  root api-design.md / security-review.md
- README: softened tagline, fixed a truncated git-workflow sentence
- lib/auth: TODO -> documented demo-scope NOTE
- '…' -> '...' in CLI script stdout (UI keeps the typographic '…' for loading states)
- verified: no console.log leftovers (CLI scripts only), no secrets in tracked
  files (project ref is public-by-design), no temp/backup files, 0 em-dashes in
  source + rendered UI, no stray "AI" self-labelling
Verified: next build + eslint clean; 13/13 routes 200 with real data.
Commits: b0aa3ae (+ earlier this session through 448555f).

## 2026-09-05 - roadmap batch: T26, T40, T39, T57, T55 (+ T59 sharpen, 1 bug fix)
Working the post-hackathon roadmap while another session holds app/ + components/
for the T25 UI redesign - so everything here is docs / lib / scripts / tests.

- T26 pitch one-pager - docs/pitch.md + docs/research/model-economics.md. Crux:
  content is generated once + persisted and grading is deterministic code, so AI
  is a one-time ~$0.30/unit/masjid, not per-student -> breaks even at one family.
  Numbers: Quebec homeschool ~7,900 / Muslims ~421,710 (2021 census) / 4%
  endowment draw / Sonnet 5 $2+$10 per MTok. Commit 3b83dc1.
- T40 Quebec home-instruction citations - docs/compliance/quebec-home-instruction.md.
  The 7 obligations w/ deadlines, 4 evaluation modes, a table mapping each Suffa
  report field to what it evidences (+ where it does NOT substitute), 8-item
  lawyer/DEM checklist led by the <=4-cap basis. Commit 4cbfb70.
- T39 data map - docs/data-map.md. Every table -> store -> region -> PIM? ->
  sent-to-Anthropic. FINDING: demo DB is in AWS us-west-2 (US), not Canada; 6-step
  migration plan to ca-central-1; the continuity-briefing call is the one
  sensitive cross-border flow (child names + progress) - pseudonymise before it.
  Commit 539caf8.
- T57 backup + integrity - docs/ops/backup-restore.md (PITR + nightly encrypted
  dump, RPO<=5min/RTO<=2h, 3 restore procedures + a drill) and
  scripts/check-integrity.ts (npm run check:integrity) - 10 checks FKs don't
  enforce. Verified live: all pass; negative-tested a wrong-sign ledger row.
  Commit 9d29ba8.
- T55 core-loop tests - vitest@2 + config + 33 passing tests
  (tests/{questions,compliance-status,ledger}.test.ts). Extracted
  summariseLedgerEntries() as a pure export so "principal never spendable" is
  testable. BUG FOUND + FIXED: normalize() kept a trailing '.', so 'Paris.' was
  graded wrong - own commit 0916e15. Tests commit 7248ad6.
- T59 sharpened (not done): headline is a visible EN<->FR switch that re-renders
  the whole app, persisted per user, FR settable as tenant default.
- BOARD roadmap rows corrected (T39/T40/T55/T57 were stale at todo).
Pushed through c351e12. main: build + lint + test + check:integrity green.

## 2026-09-06 - T74, T69, then T30 (real auth) + judging-prep tasks
Phase 14 (T67-T78) added from the MuslimHacks rubric. Done this stretch:
- T77 docs/qa-prep.md - drafted answers to every judge-Q&A checklist question,
  repo-grounded, honest on mocks / LLM dependency / coverage.
- T74 coverage - @vitest/coverage-v8 + npm run test:coverage; +5 boundary tests
  (38 total). Numbers: questions.ts (grading) 100%, status.ts ~98%, overall lib/
  ~8% by line (Supabase glue - T54 harness). Stated in README + pitch + qa-prep.
- T69 docs/research/market-and-competitors.md - 13 comparables across AI tutoring
  (Khanmigo $15/student/yr, $2.75B market), Islamic homeschool (Sahlah/Zaid/
  Allamah), waqf-tech (WaqfChain/baraka.fund stop at fund flow), compliance tools;
  gap matrix; folded into pitch + qa-prep.
- T30 REAL AUTH (user asked: 3 separate demo emails + a real signup page):
  * migration 0009_user_auth_link (users.auth_id -> auth.users)
  * lib/auth: session -> users row via auth_id; dev cookie still short-circuits
  * proxy.ts (Next 16 middleware rename): session refresh + guard
  * /login (+ "try the demo" buttons) + /signup; / -> dashboard-or-login; sidebar
    "switch" -> "sign out"
  * scripts/seed-auth.ts + npm run seed:auth: admin@/parent@/student@ suffa.demo,
    password suffademo1234, linked to a1/b1/c1. seed emails updated to match.
  Verified live e2e: all 3 password logins resolve to the right role/row; a real
  sb- session cookie renders /admin; unauth -> /login?next; all 3 dashboards
  render with data; build + lint + 38 tests green.
- BUG FIX (6e192d0): the 30s AI timeout I'd added for demo-resilience was too
  tight and broke bulk lesson gen (Seerah node 3 failed). Raised to 90s +
  SUFFA_AI_TIMEOUT_MS override. Content re-generated clean afterwards.
Commits: dc8d21d, fb06c89, 412745f, 6fdc7e3, 6a8b3e3, ee47c27, 6e192d0 (+ hashes).

## T38 — legal pages (/terms, /privacy, /acceptable-use)

- components/LegalDoc.tsx: shared shell — back-to-Suffa link, title + "last updated"
  stamp, mustard "Not legal advice / pilot stage / verify with counsel" banner,
  .legal-body prose styling, footer cross-links.
- app/terms/page.tsx: who can use, what Suffa is/is not (does NOT file with the
  ministère; parent keeps every legal obligation incl. ministerial exams; compliance
  status is an internal aid with illustrative thresholds), acceptable-use pointer,
  fees (flat family fee, waqf + sadaqah, scholarships), availability/termination,
  liability, Quebec governing law, contact. Multiple "(verify with counsel)".
- app/privacy/page.tsx: mirrors docs/data-map.md — collected (account, family link,
  learning results, volunteer notes, consent records; deliberately NOT address/phone/
  DOB/health), purposes (no sale, no ads, no third-party analytics), processors
  (Supabase US region → ca-central-1 pre-launch step [T39]; Anthropic incl. the one
  cross-border continuity-briefing call that sends a first name + progress, to be
  pseudonymised + PIA'd; Vercel), retention (operator-set, placeholder), Law 25
  data-subject rights (access/rectify/withdraw consent/erasure/portability), child
  consent gate, security, breach response (CAI notification + incident register),
  privacy-officer placeholder.
- app/acceptable-use/page.tsx: use-for-purpose, respect other families' privacy (no
  URL/identifier guessing or API probing; report accidental access), lawful content,
  responsible use of generated lessons (review them; no jailbreak/data-extraction
  attempts; no bulk generation), account hygiene, no attacking the service (coordinated
  disclosure welcome), enforcement.
- Footer legal links added to /login; /signup gets a "by creating an account you agree
  to the Terms and Privacy Policy" line.
- Privacy-officer name/email + exact retention window left as explicit operator
  placeholders — decisions, not code.
- eslint clean; next build clean (all 3 pages prerender static).
Commit: a18b8c8

## T36 — Quebec Law 25 baseline

- migration 0011_consent_records: append-only table (masjid_id, student, guardian,
  consent_version, purposes[], granted, document_hash, recorded_at) + a
  BEFORE UPDATE OR DELETE trigger that rejects mutation (same pattern as audit_log).
- lib/consent.ts: CONSENT_VERSION = "2026-09"; CONSENT_PURPOSES (curriculum /
  ai_instruction / compliance_record / retention, each with label + detail);
  recordConsentDecision, listConsentRecords, getActiveConsent (latest row for the
  current version, granted), hasActiveConsent. Withdrawal = a new granted=false row.
- lib/db/privacy-queries.ts: exportFamilyData(guardian) — guardian profile + every
  linked child (getChildrenForParent, masjid+relationship scoped) with pods,
  lesson_progress, checkpoint/unit/term results, compliance_reports, pod_barakah_log
  (child-specific), consent_records. requestDataErasure(guardian, reason) — files a
  support_requests row (category 'data-erasure') + recordAudit
  'privacy.erasure_requested'; does NOT delete.
- app/parent/privacy/page.tsx (nav: "Your data", shield icon) — download export,
  correct-something pointer, deletion-request form + the guardian's own request list.
  app/parent/privacy/export/route.ts — GET, parent-only, JSON attachment, audits
  'privacy.data_exported'. app/parent/privacy/actions.ts — requestErasureAction.
- SupportCategory gained 'data-erasure'; CAT_TONE maps updated in app/help/page.tsx
  + components/admin/SupportInbox.tsx (build caught the two indexers).
- docs/privacy/law25-baseline.md: person responsible (operator placeholder), consent
  standard + how Suffa meets it, data-subject rights table (with the still-open
  scripted-erasure + export-UI items called out), retention table with defensible
  defaults, cross-border summary (-> T39), breach response (CAI + 5yr incident
  register), governance checklist, and an "Open items summary".
- Verified live: migrate applied 0011; exportFamilyData for the demo family returns
  Yusuf with pods=1/checkpoints=1/barakah=2; consent grant->active, withdraw->
  inactive, history kept (3 rows), UPDATE blocked by the trigger; demo child left in
  a consented state so the T37 gate won't lock the walkthrough.
- eslint + next build clean.
Commit: c9db4b3

## T37 — parental consent flow for minors

- app/parent/consent/page.tsx: per linked child, shows the four CONSENT_PURPOSES
  (label + detail), consent status badge, and either a grant form (guardian
  checkbox + "Give consent") or a withdraw form with the effect spelled out.
- app/parent/consent/actions.ts: grantConsentAction / withdrawConsentAction, both
  gated by assertGuardianOf() (child must be in getChildrenForParent) and both
  recordAudit (consent.granted / consent.withdrawn). recordConsentDecision from
  lib/consent.ts.
- components/student/ConsentGate.tsx + app/student/layout.tsx: if
  hasActiveConsent(user.id) is false the layout returns <ConsentGate> instead of
  the DashboardChrome + children — covers /student, /student/[courseId], exam.
  A lookup error fails OPEN (don't lock out a consented child).
- app/parent/page.tsx: "playground is locked until you complete the consent step"
  warning banner + link when any linked child lacks consent.
- app/parent/layout.tsx: nav "Consent" (new NavIcon "check" glyph).
- Verified live: guardian-of guard true for the real child / false for a bogus id;
  gate blocks after withdraw, opens after grant; demo child (Yusuf / c1) left
  consented so the student walkthrough isn't gated.
- eslint + next build clean.
Commit: 03f0ebf

## T29 — public marketing landing

- app/page.tsx: rewritten from the redirect stub to a static public landing —
  hero, Ashab al-Suffa name + funding note, "why pods break" (volunteer churn),
  how-it-works 3 cards, one-platform-three-views, join section (families / masjids
  via hello@suffa.community mailto). No auto-redirect for signed-in users (judges
  need the landing); dashboards still gated by proxy.ts.
- SEO: app/layout.tsx metadataBase + title template "%s — Suffa" + default desc;
  per-page titles reduced to bare names (terms/privacy/acceptable-use/parent
  privacy+consent). openGraph block on the landing. app/opengraph-image.tsx
  (next/og ImageResponse, 1200x630, brand colours). app/sitemap.ts (6 public
  pages). app/robots.ts (disallow /admin /parent /student /api /print + sitemap).
- lib/env.ts: siteUrl from NEXT_PUBLIC_SITE_URL (default https://suffa.community).
- Analytics: shipped with none (matches data-map "no third-party tracker on a
  minors' product"); Plausible-style snippet left as an operator one-liner.
- Verified: eslint + next build clean; / is now ○ static; next start smoke test —
  / 200 with correct <title>, /sitemap.xml + /robots.txt render.
Commit: 9087c83

## T64 — learning analytics dashboard

- lib/db/analytics-queries.ts: getLearningAnalytics(masjidId) — built on
  listStudents + getChildReports (fixed query count) + assembleFromChildReport so
  "at-risk" == the families' compliance definition. Produces: active students +
  rate; at-risk spread (on_track/watch/gap); per-course completion rate,
  unit-assessment pass rate, drop-off histogram (students by furthest checkpoint
  passed); pod cohorts (students/avg progress/checkpoint pass/at-risk); volunteer
  churn rate + departures90d; rough waqf runway (4% draw + sadaqah vs committed
  outflow). analyticsToCsv() flattens it.
- app/admin/analytics/page.tsx: stat cards + inline drop-off bars + cohort table +
  RegulationNote. Export CSV button -> app/admin/analytics/export/route.ts (GET,
  admin-only, text/csv attachment).
- app/admin/layout.tsx: nav "Learning analytics"; components/ui/NavIcon.tsx new
  "chart" glyph.
- Verified live (demo masjid): 4 students all active, watch 2 / gap 2, 3 course
  histograms (Math [2,2,0,0] etc), cohort "Pod Al-Farabi" 4 students/17%/67%/4
  at-risk, churn 33% (2 active 1 departed), runway ~0.96yr, CSV renders.
- "at-risk over time" / "cohort by term" shipped as current snapshot only; time
  series needs a periodic aggregate-snapshot job (noted in task).
- eslint + next build clean.
Commit: 87dccc4

## T65 — define + instrument the core metrics

- docs/metrics.md: the 7-metric set with exact formula, source table, cadence and
  target for each (completion rate, time-to-value, family retention 30d, at-risk
  count, volunteer churn, AI $/active student, waqf runway). States the
  instrumentation stance: NO event pipeline / tracker — everything is derived on
  read from operational DB state; a time series needs a periodic aggregate-
  snapshot job (the one open follow-on).
- lib/db/analytics-queries.ts: getMissionHealth(masjidId) assembles the 7 from
  getLearningAnalytics + getMonthSpend (T56) + users.created_at / checkpoint
  timestamps (time-to-value = median days enrol->first passed checkpoint;
  retention = share with a checkpoint attempt in 30d). analyticsToCsv() gains an
  optional health arg -> a mission_health CSV section.
- app/admin/analytics/page.tsx: "Mission health" band (teal card, 7 figures) above
  the detail. export/route.ts fetches health too.
- Verified live: retention 1.00, at-risk 4 (1.00), churn 0.33, AI $/active $0.13,
  runway 0.96yr. time-to-value null on the demo (seed checkpoint timestamps are
  backdated before users.created_at — median correctly returns null; real usage
  has created_at first). eslint + next build clean.
Commit: 31d895e

## T62 — mobile / responsive audit

- docs/review/2026-09-05-responsive-audit.md: static pass over every route +
  component at 360/768/1280. Verdict: T25 already baked responsiveness in
  (breakpoint-prefixed grids, overflow-x-auto table wrappers, viewBox SVGs,
  md-drawer nav) — no route scrolls the page sideways.
- Fixes:
  * app/globals.css: body { overflow-x: clip } safety net (clip, not hidden, so
    the sticky sidebar keeps working).
  * components/Sidebar.tsx: min-h-11 on the mobile Menu button, drawer Close
    (+aria-label), and the nav links (rail+drawer shared); min-h-9 on sign-out.
  * app/login/page.tsx: demo-role buttons min-h-11 w-full flex-centered.
  * app/admin/ledger/page.tsx, app/admin/pods/page.tsx: min-w-[32rem]/[30rem] on
    the data tables so columns scroll instead of crushing at 360px (matches the
    analytics cohort table from T64).
- Left as-is with rationale: ComplianceReportView table (shared with print),
  Button size=sm (admin density; WCAG 2.5.8 AA allows 24px+spacing), inline
  footer links. Drawer focus-trap + prefers-reduced-motion deferred to T60.
- Verified: next build + 62 tests + eslint green; overflow-x:clip present in the
  built CSS bundle; every route 200 with the dev-role cookie.
Commit: 1666f8c

## T31 — Postgres RLS policies per table

- supabase/migrations/0016_rls_policies.sql (coexists with 01KZ's 0016_locale.sql;
  migrate.ts tracks by filename — repo already has 0006/0007/0009/0011 pairs):
  * SECURITY DEFINER helpers public.app_masjid_id() / app_role() resolve
    auth.uid() -> the caller's masjid/role. Definer so their own read of `users`
    doesn't recurse through users' RLS.
  * RLS ENABLED on all 32 app tables (explicit allowlist; schema_migrations left
    alone so the migrate runner is unaffected).
  * per-table SELECT policy `<table>_tenant_read` (to authenticated) scoping rows
    to app_masjid_id(): direct masjid_id (13), via student_user_id->users (11),
    via pod_id->pods (3), via course_id->courses (3), lesson_contributions via
    node_id->pathway_nodes->courses.
  * service_role keeps BYPASSRLS -> the app (all service-role) is unchanged.
- scripts/check-rls.ts + `npm run check:rls`: 13 assertions. anon-no-auth sees 0
  rows on users/pods/checkpoint_results/masjids/waqf_ledger; signed-in demo parent
  sees ONLY masjid 1, and a 2nd masjid inserted behind their back stays invisible;
  in-tenant reads still return rows.
- Deferred to new task T79: move reads onto the authed client + write policies
  (a real lib/db refactor, needs sign-off; app stays correct on service-role).
- docs/architecture-rationale.md updated (tenancy para + tradeoffs row).
- Verified: migrate applied; check:rls 13/13; check:integrity all pass; 62 tests;
  next build; dashboards + / + /login all 200 (post-merge with T59 i18n).
Commit: d555124

## T79 — RLS write policies + authed reads (fork agent-ad973a8f668b60ab6, own worktree branch, NOT pushed)

- supabase/migrations/0017_rls_write_policies.sql:
  * helper public.app_user_id() (SECURITY DEFINER) -> auth.uid() to users.id.
  * Bucket A (insert/update/delete, `masjid_id = app_masjid_id() and app_role()='admin'`):
    volunteers, courses, waqf_ledger, masjid_ai_budget, family_fee_status,
    sponsorships, pods, pod_barakah_log.
  * Bucket B (admin, via join): pod_students/parent_children/compliance_reports
    (student->users.masjid_id), pod_progress/pod_briefings/pod_session_notes
    (pod->pods), units/pathway_nodes/term_exams (course->courses),
    lesson_contributions (node->course).
  * Bucket C (insert only, owner-or-admin): checkpoint_results,
    unit_assessment_results, term_exam_results, lesson_progress, review_items,
    path_events, node_remediations, tutor_messages. No update/delete.
  * Bucket D: users (self-update OR admin-manage), masjids (admin-update-own),
    support_requests (self-insert + admin-update), consent_records
    (guardian-of-child OR admin, insert only). audit_log / model_call_log /
    consent_records get NO authed write policy (append-only triggers + service).
- lib/db/server.ts: getReadClient() — dev-role cookie/env -> getServiceClient();
  else getServerClient() (RLS-enforced authed SSR client). DEV_ROLE_COOKIE
  re-declared locally to dodge a lib/auth <-> lib/db/server import cycle.
- lib/db/parent-queries.ts, lib/db/analytics-queries.ts: getServiceClient() ->
  await getReadClient() for their reads (proof-of-pattern). Every other lib/db/*
  file and all writes stay on service-role -> enumerated in T79 task file, new T80.
- scripts/check-rls.ts: +2 write assertions (parent can't INSERT checkpoint_result
  for an M2 student; non-admin parent can't INSERT waqf_ledger in own masjid).
- Verified vs live DB: migrate applied 0017; check:rls 15/15 ("cross-tenant reads
  AND writes are refused"); check:integrity all pass; npm test 62/62;
  tsc --noEmit clean; eslint clean on changed files.
- next build NOT run in the fork (worktree has no local node_modules; Turbopack
  won't resolve `next` from the parent tree). Delta = 1 helper fn + client swaps
  in 2 already-async modules + SQL; tsc covers it. Run next build on merge.
- docs/architecture-rationale.md: tenancy section + tradeoffs row rewritten for
  the combined T31 + T79 state.
- Merge notes for parent: 0017 already applied to the live DB. New files T79
  touched: 0017_rls_write_policies.sql, T80-rls-finish-authed-reads.md. Modified:
  lib/db/server.ts, parent-queries.ts, analytics-queries.ts, scripts/check-rls.ts,
  docs/architecture-rationale.md, progress/tasks/T79-*.md, progress/BOARD.md.
  BOARD in the worktree is the pre-T43/T46 version — parent should re-apply the
  T79 done + T80 row onto the current BOARD, not overwrite.
Commit: (fork branch — parent to cherry-pick/merge)

## T63 — multi-masjid onboarding

- migration 0021_masjid_applications (RLS on, no policy — service-role only).
- lib/platform/applications.ts: submitMasjidApplication (validated, soft dedupe
  per pending email), listMasjidApplications, countPendingApplications,
  approveApplication (→ provisionMasjid from T33, temp password, audit
  platform.masjid_provisioned), rejectApplication.
- app/for-masjids/{page,actions}.ts — public application form, i18n forMasjids.*
  (en+fr, ~22 keys). Landing "For masjids" links to it.
- app/platform/applications/{page,actions,ApplicationCard}.tsx — pending + reviewed
  lists; approve provisions inline and shows one-time creds; reject records it.
  Pending count on /platform header.
- app/signup/actions.ts: non-demo signup now guarded — admins → /for-masjids,
  families → "ask your masjid for an invite". DEMO_MASJID_ID audit in the task
  file: signup was the only app-code offender; rest is seed/demo tooling.
- Bullet 2 (adopt/fork curriculum) split to new task T81 (depends on T50).
- Verified live: submit → dedupe → approve → masjid+admin+3 courses (fr) → app
  closed → cleanup. eslint + build + 62 tests + check:i18n (208 keys) green.
Commit: ca5e82e

## T80 — finish authed reads (agent failed on rate limit; done inline)

- lib/db/server.ts: getReadClient() hardened with try/catch → service-role fallback
  when there's no request context. next/headers import made lazy (await import)
  so client components importing query-file types don't pull it into the browser
  bundle (this broke `next build` once query files imported from lib/db/server).
- Read/write-aware migration of the 13 T80 files + volunteer-portal-queries: read
  fns → `await getReadClient()`, any fn with .insert/.update/.delete/.upsert kept
  on getServiceClient(). Reverted the 5 newer files (authoring/skill-tree/question-
  bank/attendance/path) as out of scope → T82.
- Verified: next build, 68 tests, check:rls 15/15 (cross-tenant read+write refused),
  check:integrity, check:i18n; dev-role dashboards all 200; migrated helpers return
  data via the non-request fallback. Full per-route browser click-through as a
  logged-in user is the residual (no browser extension) → noted in T82.
Commit: 9db3c85

## T47 + T41 — pod board + moderation (done together)

- migration 0023_pod_board: pod_board_posts (thread_id self-ref, RLS masjid-read)
  + pod_board_reports.
- lib/moderation.ts: screenPost() — profanity list + email/phone/url/address
  regexes → held; maskPii() for the author's view.
- lib/db/board-queries.ts: listPodThreads / getThread / createPost (screens +
  barakah "helps others" hook, 1/day) / reportPost (holds a visible post) /
  moderatePost (release|hide, audited) / listModerationQueue / countModerationQueue.
- components/board/PodBoard.tsx (shared client), components/admin/ModerationQueue.tsx.
- /student/board (nav item), /volunteer/board (nav item, all covered pods),
  /admin/board (nav item + held-count badge). i18n board.* + moderation.* EN/FR
  (520 keys in sync).
- docs/moderation/policy.md — safety-by-design, retention table, takedown.
- Verified live: post → peer reply → cooperation barakah note; profanity+PII →
  held + masked + queue; report → held; admin release/hide. 3 routes 200, no
  console errors. eslint + build + 68 tests + check:i18n green.
Commit: a0e5720 / a0e5720

## T81 — per-masjid curriculum (adopt shared / fork)

- migration 0024_reference_curriculum: masjids.kind ('tenant'|'reference') +
  seeds the reference masjid (id ...fe). `npm run seed:reference` deep-copies the
  demo masjid's courses/units/nodes (with lesson_content + checkpoint_content)
  into it — 3 courses / 9 nodes.
- lib/platform/reference-curriculum.ts: copyCurriculum(from,to),
  adoptSharedCurriculum(to), referenceHasCurriculum(). Name-dedup, idempotent.
- provisionMasjid(): adopts the full shared curriculum when available, skeleton
  fallback. /admin/authoring empty state -> AdoptCurriculumButton ->
  adoptSharedCurriculumAction (audited). The adopted copy is the masjid's own and
  editable via T50 = the fork.
- getPlatformOverview excludes kind='reference'.
- Verified live: adopt 3/9 with content; 2nd adopt no-op; reference hidden from
  /platform. eslint + build + 68 tests + check:integrity green.
Commit: 4b94c11

## T82 — RLS remaining reads + parent relationship-scope

- authoring/skill-tree/question-bank/attendance/path-queries: read fns →
  getReadClient() (read/write-aware pass; writes stay service-role).
- migration 0025_rls_parent_scope: student-record SELECT policies + parent_children
  + consent_records now also require, for app_role()='parent', a parent_children
  link to the row's student. A parent can't read other families' records via a raw
  authed query anymore.
- check-rls: +1 assertion "parent sees checkpoint_results for their linked
  children ONLY" → 16/16 pass.
- Writes axis split to T83 (needs a browser click-through).
- build + 68 tests + check:integrity + dashboards/exam/authoring 200.
Commit: 7a92492

## T60 — accessibility pass (agent died on rate limit; done inline)

- Skip link + <main id tabIndex=-1> (dashboards + landing + /for-masjids);
  <nav aria-label> on sidebar.
- Sidebar drawer: role=dialog/aria-modal/name, focus trap, Escape, body scroll
  lock, focus restore to trigger (aria-expanded/haspopup).
- globals.css: @media (prefers-reduced-motion: reduce) + .skip-link styles.
- Forms: label-wraps in PodCard + VolunteerManager; role=alert on login/signup/
  for-masjids errors. OfflineIndicator -> useSyncExternalStore (SSR-safe, no
  setState-in-effect, role=status live region).
- Contrast: --ink-4 2.5:1 on bg -> light #7a6b55 / dark #9a8c76 (>=4.5).
- scripts/check-a11y.ts (axe-core + jsdom, 6 screens, serious/critical gate) +
  npm run check:a11y + CI step. jsx-a11y eslint rules -> error.
- docs/review/2026-09-06-a11y.md — fixes + the manual SR/keyboard pass still owed.
- Verified: eslint clean, build, 68 tests, check:a11y green, check:integrity.
Commit: fbe2d7b

## T66 — cognitive-accessibility "simple mode"

- migration 0026 users.simple_mode; lib/simple-mode.ts (cookie -> pref -> false).
- Student layout -> DashboardChrome data-simple. globals.css [data-simple]: bigger
  type/spacing, decoration + motion off, [data-simple-hide] panels hidden (tutor,
  offline download, exam timer, home mascot/flourish).
- SimpleModeToggle in the student sidebar; parent sets per-child default on
  /parent/consent (setSimpleModeAction, audited, guarded).
- Presentation-only (CSS + hiding). Verified: attr only with cookie/pref;
  persistence + guard; build + 68 tests + eslint + i18n(526).
- Follow-on: lesson pagination ("one thing at a time" in full), plain-language
  microcopy rewrite, volunteer-set default.
Commit: 2162b7f
