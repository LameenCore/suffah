# Journal — T32 fork (volunteer logins + delegated pod access)

Worktree: `.claude/worktrees/agent-abe0627ef9103769a`. Branch commits only — parent integrates.

## T32 — volunteer logins + delegated pod access

### Role plumbing (additive, shared files)
- `lib/types.ts`: `Role` union + `ROLES` array += `"volunteer"`.
- `lib/auth/index.ts`: `DEMO_USERS.volunteer` (id `…d9`, `volunteer@suffa.demo`,
  name "Br. Kareem"). `getCurrentUser` / `requireRole` are generic — no logic change.
- `proxy.ts`: `PROTECTED` += `/volunteer`.
- `components/Sidebar.tsx`: `ROLE_LABEL_KEY` (a `Record<Role,…>`) += `volunteer:
  "roleLabel.volunteer"` and the value-type union widened. Mandatory for the build.

### Migration
- `supabase/migrations/0018_volunteer_auth.sql`: `alter type user_role add value
  if not exists 'volunteer'` + `create unique index if not exists
  volunteers_user_id_key on volunteers(user_id) where user_id is not null`.
  Applied fine in the migrate runner's per-file BEGIN/COMMIT on Supabase PG 15
  (the new value is not used in the same txn).

### Volunteer portal
- `lib/db/volunteer-portal-queries.ts`:
  - `getVolunteerContext(userId, masjidId)` → the active `volunteers` row for this
    login (`user_id = userId`, in-masjid, `left_at` null) or null → gate.
  - `listVolunteerPodRefs`, `assertPodCoveredByVolunteer` (delegation guard),
    `getVolunteerPodViews` → per covered pod: students, per-course pathway position
    (read-only), last briefing, recent session notes. Reuses `listPodSessionNotes`
    / `getLatestBriefing` from continuity-queries.
- `app/volunteer/layout.tsx`: `requireRole("volunteer")` → gate check →
  `DashboardChrome`. `app/volunteer/page.tsx`: `<VolunteerPod>` per pod +
  RegulationNote.
- `components/volunteer/VolunteerGate.tsx` (mirrors ConsentGate — "ask your masjid
  to link your account").
- `components/volunteer/VolunteerPod.tsx` (client): read-only positions + briefing
  (`<BriefingView>`), session-note form, barakah check-in form.
- `app/volunteer/actions.ts`: `addVolunteerSessionNoteAction`,
  `addVolunteerBarakahNoteAction` — both `requireRole("volunteer")` +
  `assertPodCoveredByVolunteer` + `recordAudit`.

### Admin: linking a login
- `lib/db/volunteer-queries.ts`: `VolunteerRow` += `userId`/`userEmail`; `SELECT`
  embeds `user:users ( email )`; `linkVolunteerLogin` (guards: account exists in
  masjid, role=volunteer, not already linked elsewhere) + `unlinkVolunteerLogin`.
- `app/admin/volunteers/actions.ts`: `linkVolunteerLoginAction` /
  `unlinkVolunteerLoginAction` (audited).
- `components/admin/VolunteerManager.tsx`: a `<LoginLink>` row per active volunteer
  (plain English — file isn't i18n'd yet).

### Signup + seed
- `app/signup/page.tsx`: volunteer option added; note updated.
- `supabase/seed.sql` + `scripts/seed.ts`: new `users` row `…d9` (role volunteer,
  `volunteer@suffa.demo`) + `volunteers.d1.user_id = d9`. `seed:auth` picks up the
  new DEMO_USERS entry automatically.
- Applied to the shared DB non-destructively (targeted upsert + a one-off auth-user
  create; did NOT run full `npm run seed`).

### i18n
- `lib/i18n/messages/en.ts` + `fr.ts`: `roleLabel.volunteer`, `auth.roleVolunteerOpt`,
  a `volunteer.*` block (~21 keys). `npm run check:i18n` → 133 keys in sync.

### Verification (live, worktree own node_modules)
- `npx eslint` clean; `npx next build` clean (`/volunteer` in the route list);
  `npm test` 62/62; `npm run check:i18n` sync; `npm run check:integrity` all pass.
- `next start` smoke: volunteer→/volunteer 200 (renders Pod Al-Farabi, briefing,
  session notes, barakah); volunteer→/admin & /parent 307; admin→/volunteer 307;
  admin/parent/student dashboards unaffected.
- Live queries: `getVolunteerContext(d9)` → Br. Kareem; `getVolunteerPodViews` →
  Pod Al-Farabi (4 students, 3 courses @1/3, 5 notes, model briefing); delegation
  guard rejects a bogus pod id; `linkVolunteerLogin("parent@suffa.demo")` refused
  ("not a volunteer account"); unlink → `/volunteer` shows the gate; relink → 200.

### Merge notes for the parent
- Renumber `0018_volunteer_auth.sql` only if another migration claimed 0018 first.
- `lib/types.ts` / `lib/auth/index.ts` / `proxy.ts` / `components/Sidebar.tsx`
  additions will conflict trivially with T33's role addition — keep both entries.
- The worktree's `node_modules` was `npm ci`-installed locally (partial-symlink
  attempts failed); safe to discard on `git worktree remove`.
