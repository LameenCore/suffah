---
id: T27
title: Deploy to Vercel (staging + prod)
phase: 8
status: blocked
owner: —
claimed: —
updated: 2026-09-06
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
blocker: >
  Team decision (2026-09-06): Vercel is out — it now asks for payment, and its
  deploy's DB-backed routes 500'd anyway. The demo runs on `npm run dev` (or a
  recording, T28); a hosted URL is a nice-to-have, not required.
  As of 2026-09-06 another Claude session is exploring **Cloudflare Pages** as a
  free alternative — if that's you, just claim this task (the "Done when" below
  applies to any host, not only Vercel) or split a T82 for it. Released to
  owner:— so you don't have to wait out the stale-reclaim window.
---

## Why
A URL judges can click beats a localhost demo. README currently says  "Vercel is only for
later".

## Done when
- [ ] Vercel project wired to the repo; env vars set (Supabase, Anthropic, demo flags)
- [ ] Separate staging + prod; prod build passes; all routes smoke-tested on the deployed
      URL
- [ ] NEXT_PUBLIC_SUFFA_DEMO_MODE off in prod; note the deploy URL in README

## Notes (owner appends)

### 2026-09-06 — smoke-tested the existing deploy, then blocked
There was a deploy at `suffah-gamma.vercel.app`. Smoke test:
- **Public/static pages OK**: `/` (EN + FR), `/login`, `/terms`, `/for-masjids`,
  `/robots.txt`. i18n + responsive fine. The static build shipped completely.
- **Every DB-backed route 500s**: `/student`, `/admin`, `/parent`, `/signup` —
  "A server error occurred." Client console: minified React error #441 (downstream
  of the streamed server error). Error digests: 1143518469, 2544510672.
- Diagnosis (unconfirmed — needs Vercel dashboard): the deployment can't use its
  database at request time. Most likely (a) env vars missing/wrong for the
  *Production* env, (b) the prod Supabase DB was never `migrate`+`seed`'d, or
  (c) `SUPABASE_DB_URL` on the non-pooler host (won't resolve from serverless —
  documented gotcha).
- Same code is fully green locally (verified E2E 2026-09-06).

Then the team decided to stay local-first (Vercel wants payment). Marked blocked.
**If revisiting:** read the Vercel Runtime Logs while hitting `/student` for the
real stack, fix env + run migrate/seed against the prod DB, confirm the pooler
host. Or pick a free host (Cloudflare Pages / Render free tier / self-host).
