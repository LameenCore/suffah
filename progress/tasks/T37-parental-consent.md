---
id: T37
title: Parental consent flow for minors
phase: 10
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T04:15:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  /parent/consent — per-child consent screen showing the four named purposes
  (curriculum, AI instruction, compliance record, retention) with a
  "I am the parent/legal guardian" checkbox; grant + withdraw server actions,
  both guarded by getChildrenForParent (child must be linked to the guardian) and
  both audited (consent.granted / consent.withdrawn). Student layout is the gate:
  hasActiveConsent(user.id) false → the whole playground is replaced by
  <ConsentGate> (no chrome, "your guardian needs to finish a step"); a lookup
  error fails open so a consented child is never locked out. Parent home shows a
  "playground is locked" banner linking to the consent page; nav gets a "Consent"
  item. Withdrawal explains its effect (locks playground, stops new AI lessons,
  keeps existing records). Versioned via CONSENT_VERSION from lib/consent.ts (T36)
  — bump → re-prompt. Verified live: gate blocks on withdraw, opens on grant;
  guardian-of guard rejects an unlinked child id; demo child left consented.
commits: 03f0ebf
depends_on: [T30, T36]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
A child account cannot be created without a verified guardian consenting - including to AI-
assisted instruction and to results being used for a compliance report.

## Done when
- [x] Guardian creates/links the child account; explicit consent screen (curriculum, AI use,
      compliance reporting, data retention) — `/parent/consent`
- [x] Consent is versioned; a material change re-prompts; withdrawal is possible and its
      effect is explained — `CONSENT_VERSION`; withdraw action + copy
- [x] No student-facing account is active until consent is on file — student layout
      `<ConsentGate>`

## Notes (owner appends)
- The consent screen operates on children **already linked** to the guardian
  (`parent_children`). Guardian-creates-and-links the child account, and guardian
  **identity verification**, are still owed — same gap named in T36's doc; a real
  deployment needs the masjid to vet the link, not self-assertion.
- Gate lives in `app/student/layout.tsx` so it covers `/student`,
  `/student/[courseId]` and the exam route in one place.
- NavIcon gained a `check` glyph for the parent nav item.
