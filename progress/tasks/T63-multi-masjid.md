---
id: T63
title: Multi-masjid onboarding + per-masjid content library
phase: 13
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T21:15:00Z
updated: 2026-09-05
completed: 2026-09-06T00:00:00Z
outcome: >
  Masjid onboarding shipped on top of T33's provisionMasjid(). Migration 0021
  masjid_applications (RLS on, service-role only). Public /for-masjids page +
  application form (i18n en/fr, soft dedupe per email). Platform admin reviews at
  /platform/applications — approve calls provisionMasjid() (tenant + first admin +
  3-course skeleton), shows a one-time temp password, marks the application
  approved with provisioned_masjid_id + an audit entry; reject records the
  decision. Pending count surfaced on /platform. Landing "For masjids" links to
  /for-masjids. DEMO_MASJID_ID audit: the only app-code use was app/signup —
  guarded so a non-demo signup routes admins to /for-masjids and families to an
  "ask your masjid for an invite" message; every other DEMO_MASJID_ID use is
  demo/seed/test tooling that is correctly demo-scoped. Verified live: submit →
  dedupe → list → approve → masjid+admin+3 courses created → application closed →
  cleanup. eslint + build + 62 tests + check:i18n (208 keys) green.
commits: PLACEHOLDER63
depends_on: [T30, T33]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
The model's scale story is 'any masjid can run this'. Today there is one hard-coded demo
masjid.

## Done when
- [x] Self-serve / admin-assisted masjid signup -> provision tenant, first admin, starter
      courses — `/for-masjids` application + `/platform/applications` approval → `provisionMasjid()`
- [~] Per-masjid content: adopt the shared curriculum or fork/author its own — **split to
      T81** (depends on T50, the course-authoring UI, which is the editing surface)
- [x] Remove the hard-coded DEMO_MASJID_ID assumptions from app code — the one real
      offender (`app/signup/actions.ts`) is now demo-mode-gated; the rest is seed/demo
      tooling. Audit in notes below.

## Notes (owner appends)
- **DEMO_MASJID_ID audit (2026-09-06):**
  - `app/signup/actions.ts` — was the only app-code hardcode; now behind `env.demoMode`
    (non-demo: admins → `/for-masjids`, families → invite message). ✅
  - `lib/auth/index.ts` — the constant + `DEMO_USERS` fixtures. Legit demo identity.
  - `lib/demo/reset.ts`, `scripts/generate-*.ts`, `scripts/seed*.ts`, `scripts/check-rls.ts`,
    `supabase/seed.sql`, `0012_ai_budget.sql` — demo/seed/test tooling, correctly scoped
    to the demo tenant. No change needed.
- **T81 (new)** covers per-masjid curriculum fork/adopt once T50 lands.
- Invite links for per-masjid families are not built — non-demo family signup is blocked
  with a message. A future task if self-serve family onboarding is wanted.
