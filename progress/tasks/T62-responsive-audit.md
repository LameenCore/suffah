---
id: T62
title: Mobile / responsive audit
phase: 13
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T06:20:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  Static audit of every route + component at 360/768/1280 —
  docs/review/2026-09-05-responsive-audit.md. Verdict: the T25 redesign already
  bakes in responsiveness (every grid is breakpoint-prefixed, every table has an
  overflow-x-auto wrapper, SVGs use viewBox+w-full, drawer nav under md). Fixes:
  (1) body { overflow-x: clip } page-level guard (clip keeps sticky working);
  (2) tap targets bumped to >=44px on the nav-critical controls — mobile Menu
  button, drawer Close, sidebar nav links, login demo-role buttons — with
  min-h-9 on secondary sign-out; (3) min-w on the ledger + pods tables so 4
  columns scroll cleanly at 360px instead of crushing. Dense inline admin
  controls left at 24px+ (documented; WCAG 2.5.8 AA). Verified: build + 62 tests +
  lint green; overflow-x:clip confirmed in the built CSS bundle; all routes
  render 200 with the dev-role cookie.
commits: 1666f8c
depends_on: [T25]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Families will open this on a phone. Every dashboard needs to be checked, not just the
landing page.

## Done when
- [x] Every route audited at 360 / 768 / 1280; no horizontal page scroll; nav tap targets
      >= 44px (dense inline admin controls stay 24px+ with spacing — rationale in the doc)
- [x] Admin sub-pages work on a phone — tables get min-w + scroll wrapper; ledger chart /
      continuity matrix SVGs already scale
- [x] Student playground is comfortable one-handed — single-column, w-full inputs,
      whitespace-pre-line lesson text; nothing to change

## Notes (owner appends)
- Deferred to **T60** (accessibility, not layout): mobile-drawer focus trap +
  Escape + body-scroll-lock; `prefers-reduced-motion` for the `.wf-stream`
  animation and hover transitions.
- A **real-device pass** (iOS Safari / Android Chrome at 360px) is still worth
  doing before a public launch — static review catches layout math, not
  font-boosting or URL-bar resize quirks. Noted in the audit doc.
