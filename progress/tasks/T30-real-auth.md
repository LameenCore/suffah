---
id: T30
title: Real auth - sign-up / sign-in page + 3 role accounts (replace the dev cookie)
phase: 9
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr
claimed: 2026-09-06T01:35:00Z
completed: 2026-09-06T02:40:00Z
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
- [x] **Supabase Auth** wired: email + password. `getCurrentUser` resolves the
      Supabase session -> `users` row via `users.auth_id` (migration 0009);
      `requireRole` -> `/login`. No call-site changes. Google/Microsoft deferred.
- [x] **`/login`** (email+password + "try the demo" role buttons + link to signup),
      **`/signup`** (name/email/password/role -> creates the auth user, auto-confirms
      via the service role, inserts the `users` row, signs in). **Sign out** in the
      sidebar. `proxy.ts` (Next 16 middleware) refreshes the session + bounces
      unauthenticated visitors off `/admin` `/parent` `/student`. `/` -> dashboard or `/login`.
- [x] **Three demo accounts** - `admin@` / `parent@` / `student@ suffa.demo`,
      password `suffademo1234` (`SUFFA_DEMO_PASSWORD`). `scripts/seed-auth.ts` +
      `npm run seed:auth` creates the `auth.users` rows and links them to the seeded
      a1/b1/c1. Documented in README + on the login page. Seed emails updated to match.
- [x] `NEXT_PUBLIC_SUFFA_DEV_ROLE` + the signed dev cookie still work (local dev, CI,
      the login "try the demo" buttons); they are no longer the default path.
- [x] build + lint + 38 tests green. Auth verified live: all 3 accounts sign in and
      resolve to the right role/row; `/` and `/admin` redirect correctly. Dashboard
      render re-checked after content regen.

## Notes (owner appends)
- T25 landed before this started, so the pages could be built directly in `app/` +
  `components/` with the new design system (Card/Button/Motif/Mascot).
- migration `0009_user_auth_link.sql` shares the `0009` number with the other
  session's `0009_support_requests.sql` - both apply (runner tracks full filenames).
- One-off: `npm run seed` wipes the masjid (FK cascade) which drops the `auth_id`
  links AND the generated content - run `seed:auth` + the `gen:*` scripts after any
  full reseed. `demo:reset` does not touch auth.
- Seed `users.email` for c1 changed `yusuf@` -> `student@suffa.demo` to match the
  login. `name` stays "Yusuf (Secondary 1)".
- T31 (RLS) builds directly on this - policies key off `auth.uid()` and `users.auth_id`.
- Not done: Google/Microsoft OAuth, password reset, and folding the parent-creates-
  child consent flow (T37) - all follow-ups.
commits: 6a8b3e3, ee47c27, 6e192d0
