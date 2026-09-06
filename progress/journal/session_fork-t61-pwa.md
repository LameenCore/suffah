# Journal — fork-t61-pwa

Session URL: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr (fork: T61, own git worktree)
Started: 2026-09-06T20:20:00Z

Append-only. Newest at the bottom.

---

## 2026-09-06T20:20:00Z — claimed T61
Fork spun up in worktree `worktree-agent-a6066b288abb12751`. Claimed T61 (deps: none).
Worktree had no node_modules / .env.local (git worktrees don't copy gitignored
paths) — symlinked both from the main checkout so `next build` / `next start` /
`--env-file` resolve. Both are gitignored; not committed. `.env.local` symlink
removed after verification (never read its contents).

## 2026-09-06T20:40:00Z — T61 implementation

New files:
- `app/manifest.ts` — MetadataRoute.Manifest, standalone, start_url `/student`,
  theme `#2f7d78` / bg `#faf4ea`, three icon entries.
- `app/pwa-icon/[size]/route.tsx` — next/og ImageResponse, force-static,
  generateStaticParams for 192 & 512; white 8-point star on teal, 18% padding
  (maskable-safe).
- `app/offline/page.tsx` — standalone fallback page, uses `getT`.
- `app/api/offline/unit/route.ts` — GET `?courseId=`, student-auth, returns the
  current node's `lesson_content` + answer-stripped checkpoint. Thin wrapper over
  `getPlayground` + `stripAnswers`.
- `lib/offline/store.ts` — hand-rolled IndexedDB (`suffa-offline`, v1): stores
  `units`, `outbox`, `drafts`. All reads swallow errors (private-mode safe).
- `components/ServiceWorkerRegister.tsx` — registers `/sw.js` in production only;
  on `online` + on load, nudges the SW to drain the outbox (Background Sync tag
  `suffa-checkpoint-sync` where available, else `postMessage SUFFA_SYNC_NOW`);
  relays `SUFFA_SYNC_RESULT` to a `suffa:sync-result` window event.
- `components/student/OfflineIndicator.tsx` — online/offline pill + pending count
  + transient sync notice.
- `components/student/DownloadUnitButton.tsx` — fetches `/api/offline/unit`,
  `saveUnit`, warms the SW page cache for the current route, shows
  "Available offline".
- `public/sw.js` — hand-rolled. Navigations: network-first, `/offline` fallback,
  `/student/*` runtime-cached (only that surface). `/_next/static` + `/pwa-icon/`
  + fonts: cache-first w/ background refresh. `/api/*` + `/auth/*`: passthrough.
  `sync` + `SUFFA_SYNC_NOW` → `replayOutbox()` reads the IndexedDB outbox and
  POSTs each attempt to `/api/checkpoints/grade` (credentials: include), deletes
  on 2xx, drops on 4xx, keeps + re-registers sync on 5xx/offline; messages
  clients with `{superseded: grade.alreadyPassed}`.

Touched (minimal):
- `app/layout.tsx` — one import + `<ServiceWorkerRegister />` before `</body>`.
- `app/student/[courseId]/page.tsx` — 2 imports; `<DownloadUnitButton/>` in the
  header (only when a lesson exists) + `<OfflineIndicator/>` below it; header
  wrapper `flex` → `flex flex-wrap`.
- `components/student/Checkpoint.tsx` — client-only: restore draft on mount, save
  draft on every answer change (`updateAnswer`), submit() branches to
  `enqueueAttempt` + registers Background Sync when `!navigator.onLine` (and on a
  silent drop mid-submit), a "Saved offline" branch, and a `suffa:sync-result`
  listener that `router.refresh()`es this node once synced.
- `lib/i18n/messages/en.ts` + `fr.ts` — new `offline` block (18 keys each);
  `npm run check:i18n` → "in sync (126 keys)".

No migration added (0020 not needed — `checkpoint_results` already appends
attempts and `alreadyPassed` gives the conflict signal).

Verify:
- `npx eslint app components lib scripts` — clean (fixed one
  `react-hooks/set-state-in-effect` in OfflineIndicator via lazy `useState`).
- `npx tsc --noEmit` — clean.
- `npx next build` — clean; `/manifest.webmanifest` static, `/pwa-icon/192`+`/512`
  SSG, `/offline` + `/api/offline/unit` dynamic.
- `npm test` — 62 passed.
- `next start` (no env): `/manifest.webmanifest` 200 (valid JSON),
  `/pwa-icon/192` 200 png 3.5KB, `/pwa-icon/512` 200 png 14KB, `/sw.js` 200
  js, `/offline` 200 html.
- `next start` (env via `node --env-file`): `/student` 200, `/student/<id>` 200
  (with the new controls), `GET /api/offline/unit?courseId=<id>` 200 returning
  `{nodeId,courseId,courseName,title,lesson,checkpoint}` with checkpoint questions
  = `{id,type,prompt,options}` only (no `answer` — no leakage). No-auth → 401.

## Handoff to parent for merge
- Filename collision risk: none new. `app/pwa-icon/[size]` uses a `.` -free
  segment; fine.
- `app/layout.tsx` and `Checkpoint.tsx` also touched by the T59 i18n session —
  my diffs there are small and localized; expect a trivial 3-way merge.
- BOARD T61 row set to done. Task file + this journal are the record.
- Commit is on the worktree branch only — NOT pushed, NOT merged.
