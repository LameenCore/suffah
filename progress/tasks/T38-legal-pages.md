---
id: T38
title: Terms of Service / Privacy Policy / AUP
phase: 10
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T04:15:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  Added /terms, /privacy, /acceptable-use as static pages via a shared LegalDoc shell
  (mustard "not legal advice / pilot stage / verify with counsel" banner, last-updated
  stamp, cross-links). Privacy policy mirrors docs/data-map.md — what's stored, US region
  → ca-central-1 pre-launch step, Anthropic as processor incl. the one cross-border
  briefing call, retention, Law 25 data-subject rights, breach process, privacy-officer
  placeholder. Footer legal links added to /login; signup gets a "by creating an account
  you agree to Terms/Privacy" line. eslint + next build clean.
commits: PLACEHOLDER
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Any real user-facing product needs these; a homeschool compliance product especially.

## Done when
- [x] /terms, /privacy, /acceptable-use pages (plain-language + linked from the footer and
      signup)
- [x] Privacy policy reflects the actual data map (what is stored, where, for how long, who
      processes it - incl. Anthropic)
- [x] Reviewed-by / last-updated stamp; 'not legal advice, verify with counsel' where
      appropriate

## Notes (owner appends)
- Privacy-officer name/email and the exact retention window are left as explicit
  `[to be filled by the operating masjid]` placeholders — they are operator decisions,
  not code.
- Region move (us-west-2 → ca-central-1) is called out here as a pre-launch step; the
  migration plan itself is T39.
