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

## Notes (owner appends)
