---
id: T59
title: French (Quebec) localization
phase: 13
status: doing
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T04:00:00Z
updated: 2026-09-06
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
commits: (partial, many) foundation 71356b4 6b4e6fb; 2026-09-06 ac8deca 2306eba 9c37b72 55e41e3; session 011H4sTF 8662ffb dbb991a 8b456ab 2a4f279 bc298de 4471b6f 1f82ed1 9dd1f95
note: >
  The whole UI is in FR (1087 keys). Items 1-5 of the old PICK UP HERE list are
  DONE and verified. ONLY item 6 (generated content in FR — AI generators +
  locale-keyed persistence) and item 7 (native Quebec-French review, DOCUMENT-
  only) remain. Kept `doing` because item 6 is real code. Re-claim normally
  before resuming.
---

## Why
The users are in Quebec. French is not optional here - it is a credibility and often a legal
requirement (Charter of the French Language / Law 96) for anything touching schooling.
Requested explicitly: a single control that switches the **whole app** EN <-> FR.

## Done when
- [ ] **A visible language switch (EN / FR) in the app chrome that re-renders every
      screen in the chosen locale**; choice persists per user and is the default on next
      visit; FR can be the default for a masjid/tenant
- [ ] i18n framework (next-intl or equivalent); every UI string externalised into
      message catalogues; no hard-coded English left in components/pages
- [ ] Generated content (lessons / checkpoints / assessments / continuity briefings) can
      be produced in FR; the compliance report + printable view available in FR
- [ ] Dates / numbers / currency localised (fr-CA); Arabic quoted text (Seerah) renders
      correctly in both locales; the marketing/landing page (T29) localised too

## PICK UP HERE (state as of 2026-09-06, 1087 message keys)

**The entire UI is now in FR.** Items 1–5 below are DONE and verified
(`check:i18n` 1087 keys in sync, `tsc`, `next build`, 68 tests, `eslint .`, plus
live `next start` spot-checks with `suffa-locale=fr`). Only items **6** and **7**
remain.

**Done and verified live in FR** — everything from earlier sessions PLUS this
session (011H4sTF):
- **Compliance screen** (was item 1): `lib/compliance/status.ts` now emits
  `signalCodes: SignalCode[]` alongside the untouched English `signals`;
  `lib/i18n/compliance-text.ts` (`levelLabel` / `overallHeadline` / `signalText`)
  restates `computeOverall`/`computeCourseStatus` output at the view layer
  (`computeOverall`'s English `headline` is never shown). Localised:
  `ComplianceReportView`, `SnapshotBar`, `TutorTranscriptView`,
  `/admin/compliance`, `/parent/compliance`, `/print/compliance/[studentId]`,
  `/print/transcript/[studentId]`. `app/parent/page.tsx` now uses the shared
  `overallHeadline`; dead `parent.overall*` keys + unused `LEVEL_LABEL` removed.
- **All 11 remaining admin sub-pages + their components** (was item 2):
  pods (+`PodCard`), volunteers (+`VolunteerManager`), ai-spend (+`BudgetForm`),
  seerah (+`SeerahContributions`), skill-tree (+`SkillTreeEditor`),
  authoring (+`AdoptCurriculumButton`, `CourseAuthoringEditor`, `[courseId]` page),
  question-bank (+`QuestionBank`), audit (all 33 action-verb labels keyed),
  analytics, inbox (+`SupportInbox`), barakah (+`BarakahCheckIn`).
- **`/help` + `HelpForm`** (page wraps content in `<I18nProvider>` — it renders
  outside the dashboard route groups); **`/parent/consent`** (purpose
  labels/details keyed by `CONSENT_PURPOSES` key); **`/parent/privacy`**.
- **Legal pages**: `LegalDoc` shell localised; `/terms`, `/privacy`,
  `/acceptable-use` switch to an En or Fr JSX block by `locale` (the right shape
  for legal prose). **FR legal text is a model first pass** — folded into item 7.
- **Auth action errors** (was item 4): server actions redirect with a short error
  CODE; `lib/i18n/auth-text.ts` `resolveAuthError(t, raw)` maps known codes to
  `auth.err.*`, passes raw Supabase messages through. Wired in `/login`, `/signup`.
- **`default_locale` toggle** (was item 5): new `/admin/settings` page + nav entry
  (NavIcon `gear`) writes `masjids.default_locale`, audited
  (`masjid.default_locale_changed`), revalidates the root layout.

**Remaining:**

6. **Generated content in FR** — the big one, and now the ONLY code item left.
   Thread a `locale` arg through the AI generators and persist it:
   - `lib/ai/lesson.ts` `generateLesson`, `lib/ai/checkpoint.ts`
     `generateCheckpoint`, `lib/ai/assessment.ts` `generateAssessment`,
     `lib/ai/term-exam.ts` `generateTermExam` — add `locale` param, add an
     "answer in Quebec French" instruction to the prompt when `locale === "fr"`.
   - `lib/ai/continuity.ts` `generatePodBriefing`, `lib/ai/tutor.ts` `askTutor`,
     `getOrCreateRemediation` (in `lib/recommendations.ts`), `getPodFocus`
     (`lib/recommendations.ts` — deterministic English text, needs a keyed/FR
     variant).
   - **Persistence**: `lesson_content` / `checkpoint_content` / assessment rows
     need a `locale` column (new migration) and the getOrCreate lookups must key
     by `(node_id, locale)` so EN and FR copies coexist. Regeneration UX in
     `CourseAuthoringEditor` should show which locale it's regenerating.
   - **Risk**: this touches the demo's core loop (T05/T06). Do it on its own
     branch-of-work with the migration first, keep EN the default, and re-run the
     full `gen:*` scripts + student-path smoke test before merging.
   - Arabic quoted text in Seerah already renders fine in both locales (RTL spans
     are locale-independent) — no work there, just verify during item 6.

7. **Native Quebec-French review** of every string — the current FR (1087 keys +
   the two `/terms|/privacy|/acceptable-use` FR JSX blocks) is a model first pass.
   Needs a fluent Quebec-French speaker, ideally one familiar with MEQ / home-
   instruction terminology, to pass over `lib/i18n/messages/fr.ts` and the legal
   pages. Watch especially: education terms ("point de contrôle", "parcours",
   "évaluation d'unité"), the Law 25 / privacy wording, and register (the app
   addresses families — "vous", warm but plain). DOCUMENT-only for this task; the
   review itself is a non-code follow-up.

**How to translate a page** (established pattern):
- Server component: `const { t, intlLocale } = await getT(user);` then `t("ns.key")`,
  and pass `intlLocale` to any `toLocaleDateString` / currency formatting.
- Client component: `const t = useT();` (+ `useIntlLocale()` if it formats dates).
- Pass `t` down as a `Translator` prop to shared render-only components
  (`BriefingView`, `CourseCard`, `WaqfFlowDiagram` all do this now).
- Add keys to **both** `lib/i18n/messages/en.ts` and `fr.ts` in lockstep;
  `npm run check:i18n` fails on any mismatch. Interpolation is `{param}`.
- Reuse `nav.*` keys for anything that duplicates a sidebar label.
- Verify: `npm run check:i18n && npx tsc --noEmit && npm run lint && npm run build`,
  then run `npm run dev` and eyeball the page with the FR toggle (watch for
  clipped SVG text and unresolved `{param}` literals). Chrome may auto-translate
  the FR page back to English on screen — that is not a bug; check the first
  render before the translate banner fires, or disable page translation.

## Progress

### 2026-09-05 — foundation + chrome + landing + dashboard homes (session 01KZau4)
DONE:
- **i18n framework** (hand-rolled, no next-intl - the app has no locale-prefixed
  routes and the catalogues are tiny): `lib/i18n/` - `config.ts` (LOCALES,
  cookie name, INTL_LOCALE en-CA/fr-CA), `messages/{en,fr}.ts`, `index.ts`
  (`getLocale(user?)` resolves cookie -> users.locale -> masjids.default_locale
  -> "en"; `getT()` server translator), `client.tsx` (`I18nProvider` + `useT()` /
  `useLocale()` / `useIntlLocale()` for client components), `format.ts` (locale
  date/number/currency/percent), `actions.ts` (`setLocaleAction` - cookie +
  persist to users.locale).
- **The switch**: `components/LocaleSwitch.tsx` in the landing header (compact)
  and the sidebar footer. Re-renders the whole app via `revalidatePath("/",
  "layout")` + `router.refresh()`. `<html lang>` is dynamic.
- **migration 0016_locale**: `users.locale`, `masjids.default_locale` (default
  'en' so the demo starts EN; flip per-masjid for a FR-default tenant).
- **Translated**: landing page (all of it), the chrome (sidebar nav for all 3
  dashboards, footer, role label, mobile menu), student home, parent home
  (header + key links), admin overview header, /login, /signup, the /student course cards
  (CoursePath) + ConsistencyStrip. 130 keys.
- `scripts/check-i18n.ts` (`npm run check:i18n`, wired into CI) fails on any
  key mismatch. 83 keys, catalogues in sync.
- Verified live: EN default, `suffa-locale=fr` cookie flips landing + chrome +
  the 3 homes; all routes 200 in both locales; tsc + lint + build + 62 tests green.

REMAINING (mechanical - extract strings + add en/fr keys):
- Deeper components: `CourseCard` (parent), `BarakahSummary`, `Checkpoint`,
  `LessonView`, `TermExam`, `ReviewDeck`, `TutorPanel`, `RegulationNote` default,
  `PageHeader` "Back". Pattern: pass `t` from the async page (see CoursePath).
- Admin sub-pages: pods, volunteers, continuity, handoff-demo, compliance,
  ledger, ai-spend, seerah, audit, analytics, inbox (+ their components).
- /help, legal pages, consent + privacy flows; the auth *action* error
  strings (server-side redirect messages).
- Swap hard-coded `toLocaleDateString("en-CA", ...)` call sites for
  `lib/i18n/format.ts` helpers threaded with the active locale.
- **Generated content in FR**: thread a `locale` arg through `generateLesson/
  Checkpoint/Assessment/TermExam` + `generatePodBriefing` + `askTutor` +
  `getOrCreateRemediation` prompts; store locale on the content; regenerate or
  keep per-locale copies. Compliance report + `/print/*` in FR.
- A masjid-settings toggle for `default_locale` (admin UI).

### 2026-09-05 (b) — student lesson loop + auth pages (session 01KZau4)
Also translated: /login, /signup (+ LocaleSwitch on both), the /student course
cards (CoursePath) + ConsistencyStrip + next-step card, and the full student
lesson page: LessonView (Translator prop), Checkpoint / TutorPanel /
MarkCompleteButton / GenerateLessonPanel (useT), the skill-tree locked panel.
~130 new keys. The whole pre-dashboard + student-playground path is now FR.
`npm run check:i18n` in CI. 248 total keys (other sessions added offline.* /
platform.* etc). Survived rebases through the T61/T33/T79 merges.

DEMO PATH = DONE (landing, chrome, auth, student home + lesson loop, parent home).
STILL REMAINING: admin sub-pages + their PageHeaders + components, /help, legal +
consent/privacy pages, the parent CourseCard/BarakahSummary internals, FR
generated content (thread locale through the AI generators), date/currency
call-site swaps to lib/i18n/format.ts, an admin default_locale toggle, and a
native Quebec-French review of all strings.

### 2026-09-06 — parent dashboard home fully FR (session 01KZau4)
Translated the rest of `app/parent/page.tsx`: `CourseCard` internals (Pathway,
step X of Y, Checkpoints/Unit assessment/Term exam headers + empty states,
Passed/Needs review/Retry badges), `BarakahSummary` (title + lede + "whole pod"),
consent-locked banner, load-error + no-child states, the enrichment note, the
RegulationNote body, and the compliance badge label + overall headline (localised
restatement from level+counts via `overallHeadline()`, `computeOverall` untouched
so its tests stay green). Date formatting threaded through `intlLocale` from
`getT`. `ChildBlock` no longer re-calls `getT()` — `t`/`intlLocale` passed down.
+35 keys (335 total). build + lint + tsc + 68 tests + check:i18n green.

STILL REMAINING (unchanged): admin sub-pages, /help, legal + consent/privacy
pages, `ComplianceReportView` + `/print/*` (the compliance-report-FR bullet — its
headline still uses `computeOverall`'s English string), FR generated content
(thread locale through the AI generators), admin default_locale toggle, native
Quebec-French review.

### 2026-09-06 (b) — admin overview page FR (session 01KZau4)
`app/admin/page.tsx` fully localised: +37 keys under `admin.*` (at-a-glance /
learning / compliance-spread / waqf-community stat cards + hints, "By course"
line, "Manage" grid, the overview RegulationNote). The Manage grid reuses the
existing `nav.*` keys via a `labelKey: MessageKey` on each SECTION. `money()` now
takes `intlLocale` from `getT`; level labels via `admin.levelOnTrack/Watch/Gap`.
372 keys total, catalogues in sync. build/lint/tsc/68 tests green. Admin
overview (the dashboard landing screen) is now FR; the other 15 admin sub-pages
+ their components are the remaining admin scope.

### 2026-09-06 (c) — continuity + handoff-demo (the moat screens) FR (session 01KZau4)
`app/admin/continuity/page.tsx` + `ContinuityPod.tsx` + `app/admin/handoff-demo/
page.tsx` + `HandoffDemo.tsx` + `BriefingView.tsx` fully localised. New
`admin.continuity.*` (37) and `admin.handoff.*` (30) key blocks → 432 total.
`BriefingView` now takes a required `t: Translator` prop (frame labels + the
per-course status words `moving well`/`stuck`/… via a STATUS_KEY map); its 3
callers (ContinuityPod, HandoffDemo, VolunteerPod — all client, all had `t`
already or got `useT()`) pass it through. Verified live in FR: both pages render,
{name}/{pod} interpolation in the step-1 body resolves, no console errors.
The AI briefing *content* and the deterministic `getPodFocus` text stay English
(the generated-content bullet). Remaining admin: pods, volunteers, compliance,
ai-spend, seerah, skill-tree, authoring, question-bank, audit, analytics,
inbox, barakah + components.

### 2026-09-06 (d) — waqf ledger screen FR (session 01KZau4)
`app/admin/ledger/page.tsx` + `WaqfFlowDiagram` + `SponsoredOutcomes` +
`LedgerChart` fully localised. New `admin.ledger.*` block (~55 keys) → 486 total.
money()/date formatting threaded through `intlLocale`; the two SVG components take
`t`+`intlLocale` props, `LedgerChart` (client) uses `useT()`/`useIntlLocale()`.
Verified live in FR - the WaqfFlowDiagram SVG text ("Opérations dépensées à ce
jour", "rendements seulement - jamais le capital") fits without clipping;
"250 000 $" in fr-CA format; chart x-axis "août 25/26". Sponsor labels + unit
titles stay EN (seed/generated data). 4 of 5 demo-path admin screens now FR
(overview, continuity, handoff, ledger); compliance is the last + hardest (its
report content is generated by lib/compliance/report.ts in English).

### 2026-09-06 (e) — compliance + all remaining admin + help/legal/consent + auth + settings (session 011H4sTF)
Finished items 1–5. The whole UI is now FR; 1087 keys in sync.
- **Compliance**: `SignalCode[]` on the status engine (English strings + 15 unit
  tests untouched); `lib/i18n/compliance-text.ts` view-layer restatement.
  `ComplianceReportView`/`SnapshotBar`/`TutorTranscriptView` + `/admin/compliance`,
  `/parent/compliance`, both `/print/*`. Dropped dead `parent.overall*` +
  `LEVEL_LABEL`.
- **All 11 admin sub-pages + components** localised (see PICK UP HERE for the
  list). Audit's 33 action-verb labels keyed under `admin.audit.action.*`.
- **`/help`+`HelpForm`**, **`/parent/consent`**, **`/parent/privacy`**,
  **`LegalDoc`**; `/terms` `/privacy` `/acceptable-use` → per-locale JSX block
  (these routes are now `ƒ` dynamic, was `○` static).
- **Auth errors**: codes → `auth.err.*` via `lib/i18n/auth-text.ts`.
- **`/admin/settings`** new page + nav entry writes `masjids.default_locale`.
- Verified each batch: `check:i18n` / `tsc` / `next build` / 68 tests / `eslint .`
  all green; `next start` FR spot-checks on terms, privacy, help, admin
  settings/compliance, parent consent/privacy/compliance.
- **Left**: item 6 (generated content in FR — the AI generators + a `locale`
  column + `(node,locale)` keying; own migration, EN stays default, re-run
  `gen:*` before merge) and item 7 (native Quebec-French review — DOCUMENT-only).

## Notes (owner appends)
- The FR strings are a first pass by the model - a native Quebec French reviewer
  should sweep them (esp. the landing marketing copy and regulatory phrasing)
  before any real use. Charter/Law 96 context is in the task "Why". As of session
  011H4sTF this covers 1087 keys + the FR JSX blocks in `/terms`, `/privacy`,
  `/acceptable-use`.
