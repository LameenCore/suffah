---
id: T30
title: Real auth - sign-up / sign-in page + 3 role accounts (replace the dev cookie)
phase: 9
status: todo
owner: —
claimed: —
updated: 2026-09-05
depends_on: []
source: post-hackathon roadmap + user request (separate accounts, real signup)
---

## Why
Today `/` is a role picker that drops a `suffa-dev-role` cookie and there is ONE
effective identity per role. The user wants it to feel like a real webapp: a
proper **sign-up + sign-in page**, and **three distinct demo accounts - one email
each for admin / parent / student** - so a judge signs in as a real user, not
picks a role. lib/auth already returns a `SessionUser` at every call site, so the
resolver swap is contained; the visible work is the auth pages and the seeded
accounts.

## Done when
- [ ] **Supabase Auth** wired: email + password (Google / Microsoft optional).
      `getCurrentUser` / `requireRole` resolve from the Supabase session; `users.role`
      + `users.masjid_id` read from a `users` row keyed to `auth.users.id`. No call
      site changes.
- [ ] **`/signup`** - create an account (name, email, password, role for the demo;
      in production a parent creates the account and consent gates the child - see T37).
      **`/login`** - sign in. **Sign out** in the dashboard chrome. Session refresh via
      middleware; the route groups (`/admin` `/parent` `/student`) are guarded there.
- [ ] **Three seeded demo accounts**, one email each, documented in the README and on
      the login page as "try the demo":
      `admin@suffa.demo` (Masjid Admin), `parent@suffa.demo` (parent of Yusuf),
      `student@suffa.demo` / or `yusuf@suffa.demo` (Secondary 1 student). Seeded with
      a known password via a script (`scripts/seed-auth.ts`) that creates the
      `auth.users` rows and links them to the existing seeded `users` rows (ids
      a1 / b1 / c1 - keep them so all the seeded data still resolves).
- [ ] `NEXT_PUBLIC_SUFFA_DEV_ROLE` still works for local dev only; the dev cookie path
      is removed from the default flow.
- [ ] build + lint + tests green; the 5-step demo still works signed in as the three
      accounts.

## Notes (owner appends)
- COLLISION: the sign-up/sign-in pages + chrome + layout guards live in `app/` +
  `components/`, which T25 (UI redesign) is holding. Coordinate: either the T25 owner
  folds the auth pages into the redesign, or this waits until T25 lands. The
  non-colliding groundwork - `scripts/seed-auth.ts`, the `lib/auth` resolver, a
  migration if `users` needs an `auth_id` column - can be done first.
- Keep the seeded `users` ids (a1/b1/c1 ...) - `supabase/seed.sql`, `scripts/seed.ts`,
  `scripts/seed-demo-progress.ts`, `lib/auth` DEMO_MASJID_ID and every fixture depend
  on them.
- T31 (RLS) builds directly on this - RLS policies need `auth.uid()`.
