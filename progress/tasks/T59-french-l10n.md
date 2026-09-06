---
id: T59
title: French (Quebec) localization
phase: 13
status: doing
owner: https://claude.ai/code/session_01KZau462fdpkrsdLZNLrD9T
claimed: 2026-09-06T10:30:00Z
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
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
  (header + key links), admin overview header, /login, /signup.
- `scripts/check-i18n.ts` (`npm run check:i18n`, wired into CI) fails on any
  key mismatch. 83 keys, catalogues in sync.
- Verified live: EN default, `suffa-locale=fr` cookie flips landing + chrome +
  the 3 homes; all routes 200 in both locales; tsc + lint + build + 62 tests green.

REMAINING (mechanical - extract strings + add en/fr keys):
- Deeper components: `CourseCard`, `BarakahSummary`, `ConsistencyStrip`,
  `Checkpoint`, `LessonView`, `TermExam`, `ReviewDeck`, `TutorPanel`,
  `RegulationNote` default, `PageHeader` "Back".
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

## Notes (owner appends)
- The FR strings are a first pass by the model - a native Quebec French reviewer
  should sweep them (esp. the landing marketing copy and regulatory phrasing)
  before any real use. Charter/Law 96 context is in the task "Why".
