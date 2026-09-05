---
id: T29
title: Public landing / marketing page
phase: 8
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T05:10:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  Public static `/` — the Suffa story for families + donors: hero ("learning that
  doesn't stop when a volunteer moves on"), the Ashab al-Suffa name/funding note,
  the churn problem, how it works (3 cards), one-platform-three-views, and a join
  section (families → ask your masjid / create an account; masjids →
  hello@suffa.community). Root `/` no longer redirects — it's the public face;
  Sign in / Family sign-up CTAs go to /login and /signup. SEO: metadataBase +
  title template in the root layout, per-page bare titles, openGraph block,
  app/opengraph-image.tsx (next/og, 1200×630), app/sitemap.ts (public pages only),
  app/robots.ts (disallow /admin /parent /student /api /print). Smoke-tested via
  next start: / 200 + correct <title>, /sitemap.xml + /robots.txt render.
commits: PLACEHOLDER29
depends_on: [T25]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
A non-profit still needs a public face: the story, how families join, a waitlist. Distinct
from the app's dev role picker.

## Done when
- [x] Public `/` (or a marketing route) telling the Suffa story for families + donors
- [x] Waitlist / 'contact your masjid' capture; basic SEO (title, description, OG image,
      sitemap) — "ask your masjid" + `hello@suffa.community` mailto for masjid inquiries;
      title/description/OG/sitemap/robots all in place
- [~] Privacy-respecting analytics only (no GA on a minors' product) — **shipped with
      NO analytics at all**, matching `docs/data-map.md` ("no third-party tracker on a
      minors' product"). Adding a Plausible/self-hosted snippet later is a one-line
      change and an operator decision.

## Notes (owner appends)
- Deliberately no auto-redirect for signed-in users on `/` — judges/donors need to
  see the landing regardless of session. Dashboards stay auth-gated via `proxy.ts`.
- A real waitlist table was out of scope (needs a public unauthenticated write path +
  spam handling); "contact your masjid" + a mailto is the honest MVP. Follow-on if a
  real waitlist is wanted.
- `NEXT_PUBLIC_SITE_URL` added to `lib/env.ts` (defaults to https://suffa.community).
  Set it per environment for correct canonical/OG/sitemap URLs — ties to T27.
