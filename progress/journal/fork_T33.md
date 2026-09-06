# Fork journal — T33 (Platform super-admin + masjid provisioning)

Spawned from session_011H4sTF36JvRXwmwmj5Xkcr, worktree agent-a032d42f86db4f353.

## What landed
- `supabase/migrations/0019_platform_admin.sql`: `platform_admins(user_id pk -> users, created_at)`,
  RLS enabled + NO policy (service-role only). `masjids.status` text default 'active',
  check ('active'|'suspended').
- `lib/platform/auth.ts`: `isPlatformAdmin(userId)`, `requirePlatformAdmin()` (redirect
  `/login` if no session, `/` if signed-in non-member; `suffa-platform-admin=1` dev cookie
  bypass). `PLATFORM_ADMIN_COOKIE`.
- `lib/platform/queries.ts`: `getPlatformOverview()` -> per-masjid aggregate rollup
  (students/pods/volunteersActive/Departed/churnRate/aiSpendMonthUsd/waqfPrincipalUsd) —
  COUNT/SUM only, no names. `getMasjidDetail(id)`, `setMasjidStatus(id, status)`.
- `lib/platform/seed-masjid.ts`: `seedCurriculumSkeleton(masjidId)` — 3 courses (Math/
  Seerah/AI Literacy), 1 unit + 3 nodes each, grade band "Secondary 1", no lesson_content.
  Standalone (did NOT refactor scripts/seed.ts).
- `lib/platform/provision.ts`: `provisionMasjid({name, defaultLocale, adminName, adminEmail,
  adminPassword})` — insert masjid, `auth.admin.createUser` (email_confirm), linked `users`
  row (role=admin, auth_id), skeleton. Rolls back masjid + auth user on failure.
- Routes (all server components): `app/platform/layout.tsx` (minimal chrome, not
  DashboardChrome), `app/platform/page.tsx` (list + 3 stat cards + rollup table + no-PII
  note), `app/platform/new/{page,actions}.tsx` (provision form + `provisionMasjidAction`),
  `app/platform/[masjidId]/{page,actions}.tsx` (detail + `setMasjidStatusAction`),
  `app/suspended/page.tsx`.
- `proxy.ts`: `"/platform"` added to `PROTECTED`.
- `lib/auth/index.ts`: `import { getServiceClient }`; `masjidSuspended(masjidId)` helper;
  one line in `requireRole` -> `redirect("/suspended")` when suspended.
- `scripts/seed-auth.ts`: upsert `admin@suffa.demo` into `platform_admins`.
- `lib/i18n/messages/{en,fr}.ts`: `platform.*` (40 keys) + `suspended.*` (2), both catalogues.

## Verification (live DB)
- `_tmp_verify_t33.ts` (removed): 12/12 PASS — gate (admin yes / parent no), overview
  counts (demo: 4 students, 1 pod, 33% churn) + no "yusuf" in payload, provisioning
  round-trip (masjid + linked admin + 3 courses / 3 units / 9 nodes, default_locale=fr),
  suspend->suspended, reactivate->active, cascade cleanup.
- `npx next build` OK (routes /platform, /platform/[masjidId], /platform/new, /suspended).
- `npm test` 62 pass. `check:integrity` all pass. `check:i18n` in sync (151 keys).
- Server smoke: /platform* + /suspended -> 200 with `suffa-dev-role=admin; suffa-platform-admin=1`;
  `suffa-dev-role=parent` -> 307 off /platform.

## Merge notes for the parent
- Migration 0019 (0016 x2, 0017=T79, 0018=T32). Renumber if it collides.
- `proxy.ts` PROTECTED array + `lib/auth/index.ts` requireRole — T32 also edits both;
  different regions, expect a clean 3-way or a 1-line manual merge.
- node_modules was symlinked into the worktree to build; it's gitignored, not committed.
