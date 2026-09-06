---
id: T33
title: Platform super-admin + masjid provisioning
phase: 9
status: done
owner: fork/T33 (from https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr)
claimed: 2026-09-06T07:10:00Z
updated: 2026-09-05
completed: 2026-09-05T00:00:00Z
outcome: >
  Platform super-admin as a capability, NOT a Role: migration
  0019_platform_admin.sql adds `platform_admins(user_id pk)` (RLS on, no policy =
  service-role-only) + `masjids.status` ('active'|'suspended', checked). lib/
  platform/auth.ts: isPlatformAdmin() + requirePlatformAdmin() (redirects non-
  members to "/"; honours a `suffa-platform-admin=1` dev cookie). /platform route
  group (server components, minimal chrome): list every masjid with aggregate
  operational rollup (students, pods, volunteer churn, month AI spend, waqf
  principal — COUNT/SUM only, verified no student names leak); /platform/new
  provisions a masjid (lib/platform/provision.ts: tenant row + admin auth user +
  linked users row with rollback + lib/platform/seed-masjid.ts curriculum
  skeleton = 3 courses / 1 unit / 3 nodes each, no lesson_content);
  /platform/[id] suspend/reactivate. requireRole() gained a ~1-line
  masjidSuspended() check -> /suspended info page. Demo: seed-auth.ts adds
  admin@suffa.demo to platform_admins; reach it with
  `suffa-dev-role=admin; suffa-platform-admin=1`.
  Verified live (12/12 assertions): gate (admin yes / parent no), overview counts
  + no-PII, full provisioning round-trip (masjid+admin+3 courses/3 units/9 nodes,
  default_locale=fr), suspend/reactivate, cleanup. eslint + next build + 62 tests
  + check:integrity + check:i18n (151 keys, +42) green. Routes 200; non-platform-admin
  bounced from /platform.
commits: <see worktree branch>
depends_on: [T30]
source: post-hackathon roadmap (EdTech-checklist analysis)
---

## Why
Multi-masjid needs a role above masjid-admin to create masjids, seed their courses, and see
cross-masjid health - without being able to read student data.

## Done when
- [x] Platform super-admin (a capability, not a `user_role`); a provisioning screen to
      create a masjid + its admin + starter courses — `/platform/new`
- [x] Cross-masjid operational view (student/pod counts, volunteer churn, AI spend, waqf)
      with NO student PII — `/platform`, aggregate COUNT/SUM only
- [x] Explicitly separated from masjid-admin permissions — `platform_admins` membership,
      no per-masjid data access; `/platform` uses service-role after the gate

## Notes (owner appends)
- **Deliberately NOT a Role/enum value** — a platform admin is cross-tenant and
  `users.masjid_id` is NOT NULL; power is `platform_admins` membership only.
- **Merge coordination** — `proxy.ts`: added `"/platform"` to the `PROTECTED`
  array (T32 also appends `"/volunteer"` there — trivial). `lib/auth/index.ts`:
  added `import { getServiceClient }`, a `masjidSuspended()` helper, and one line
  in `requireRole` (`if (await masjidSuspended(user.masjidId)) redirect("/suspended")`).
  T32 also edits this file (adds `"volunteer"` to Role + a DEMO_USERS entry) — the
  changes are in different regions, should merge cleanly.
- Migration is `0019` (0016 x2, 0017=T79, 0018=T32). Renumber if a conflict.
- Did NOT touch `scripts/seed.ts` (used a standalone skeleton helper).
