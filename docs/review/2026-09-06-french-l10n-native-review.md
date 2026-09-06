# French (Quebec) localization — native-review scope

**Status:** the entire UI ships in French (1087 message keys in
`lib/i18n/messages/fr.ts`, plus per-locale JSX blocks in `/terms`, `/privacy`,
`/acceptable-use`). Every FR string is a **first pass by the model**. Before Suffa
is put in front of a real Quebec family, a fluent Quebec-French speaker — ideally
one familiar with ministère de l'Éducation (MEQ) / home-instruction terminology
and with Law 25 (privacy) language — must review it. This is T59 item 7 and is a
non-code follow-up.

## What to review, in priority order

1. **Regulatory / legal copy** — highest stakes.
   - `lib/i18n/messages/fr.ts`: every `regulationNote` / `pageRegulationNote` /
     `reportRegulationNote` / `complianceNote`, the `consent.*` block (Law 25
     purposes, retention, withdrawal), `compliance.*` and `admin.compliance` (MEQ
     evaluation-requirement wording).
   - `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/acceptable-use/page.tsx` —
     the `*Fr()` component in each file. These carry "(à valider avec un
     conseiller juridique)" markers that mirror the English "(verify with
     counsel)" — the review is editorial, the legal sign-off is separate.
   - Check institution names: *ministère de l'Éducation*, *Commission d'accès à
     l'information*, *Progression des apprentissages*, *Loi 25*.

2. **Education terminology consistency** — used everywhere, must be stable.
   Current choices (confirm these are the natural Quebec terms, then check every
   occurrence matches):
   | concept | FR term in use |
   |---|---|
   | checkpoint | point de contrôle |
   | pathway | parcours |
   | unit assessment | évaluation de l'unité |
   | term exam | examen de fin de trimestre |
   | pod | groupe |
   | on track / watch / gap | sur la bonne voie / à surveiller / écart qui se forme |
   | skill tree | arbre de compétences |
   | prerequisite | préalable |

3. **Register and tone.** The app addresses families directly and should stay
   **vous**, warm but plain (no marketing gloss, no anglicised syntax). Spot-check
   the landing page (`landing.*`), the student playground (`student.*`), the
   parent dashboard (`parent.*`), and the barakah / circle copy (`consent.*`,
   `parent.circle*`, `admin.barakah.*`) — these are the most family-facing.

4. **Marketing / landing copy** (`landing.*`, `forMasjids.*`) — free to be more
   idiomatic; check it reads like it was written in French, not translated.

5. **Interpolation and formatting sanity.** With the FR toggle on, walk every
   screen and watch for: unresolved `{param}` literals, clipped SVG text in the
   waqf-flow / ledger / drop-off charts, date/number formatting (should be
   `fr-CA`: `250 000 $`, `août`, `2026-09-06`), and plural forms (keys come in
   `*One` / `*Many` pairs — confirm the FR wording is correct for n=1 vs n>1;
   several were kept identical where French doesn't inflect, e.g.
   `admin.volunteers.monthsOne`/`Many` = "mois").

## What is intentionally NOT in French yet (item 6, separate code work)

- AI-**generated** content: lessons, checkpoints, unit assessments, term exams,
  the volunteer handoff briefing, the tutor's replies, remediation text, and
  `getPodFocus`. These come from `lib/ai/*` / `lib/recommendations.ts` and always
  produce English right now. Threading a `locale` through the generators + a
  `locale` column on the persisted content is tracked as T59 item 6.
- `export const metadata = { title: "…" }` browser-tab titles on a handful of
  pages (they are static exports; converting to `generateMetadata` for FR is a
  small separate pass, low priority — not user-facing content).

## How to hand back findings

Edit `lib/i18n/messages/fr.ts` directly (keep the key structure — `npm run
check:i18n` enforces EN/FR parity) and the `*Fr()` blocks in the three legal
pages. Note any term-consistency decisions here so they survive future strings.
