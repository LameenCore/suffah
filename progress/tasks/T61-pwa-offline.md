---
id: T61
title: "PWA + offline: download a unit, work offline, sync"
phase: 13
status: done
owner: https://claude.ai/code/session_011H4sTF36JvRXwmwmj5Xkcr (fork: T61)
claimed: 2026-09-06T20:20:00Z
completed: 2026-09-06T20:40:00Z
updated: 2026-09-06
depends_on: []
source: post-hackathon roadmap (EdTech-checklist analysis)
outcome: >
  Installable PWA + offline playground. app/manifest.ts (standalone, start_url
  /student, design-token colours) + generated maskable icons at /pwa-icon/192 |
  /512 (next/og). Hand-rolled public/sw.js registered by a one-line
  <ServiceWorkerRegister/> in the root layout: network-first navigations with an
  /offline fallback, cache-first for /_next/static + icons, /student/* HTML
  runtime-cached so a downloaded lesson reads back offline; nothing else is
  stored. lib/offline/store.ts is a dependency-free IndexedDB wrapper (units /
  outbox / drafts). "Download for offline" on /student/[courseId] pulls the
  current node's lesson + answer-stripped checkpoint from GET /api/offline/unit
  and stores it. Offline checkpoint submissions queue in the outbox and are
  replayed to /api/checkpoints/grade by the SW on the `online` event and via the
  Background Sync API where available (the SW is the single drainer, so no
  double-post). OfflineIndicator shows online/offline + a pending-sync count +
  the sync-result notice. Checkpoint answers are written to IndexedDB on every
  keystroke and restored on mount, so a mid-checkpoint drop or reload loses
  nothing. i18n: an `offline.*` block added to en.ts and fr.ts (check:i18n green).
commits:
  - <worktree branch worktree-agent-a6066b288abb12751; parent integrates>
---

## Why
Quebec has real rural / low-connectivity homeschoolers. The playground should work with the
network down.

## Done when
- [x] Installable PWA; a student can download the current unit (lesson + checkpoint) for
      offline use — manifest + icons + SW + "Download for offline" + IndexedDB
- [x] Offline attempts queue and sync when back online; conflict handling defined (below)
- [x] Clear offline/online state in the UI; no data loss on a drop mid-checkpoint —
      OfflineIndicator + per-keystroke draft persistence

## Conflict handling (as built)

The **server is the source of truth**. A queued offline attempt is replayed to
`POST /api/checkpoints/grade`, which appends to `checkpoint_results` and advances
the pod only on a pass (idempotent — advancing to an already-current node is a
no-op).

- If the grade response comes back with `alreadyPassed === true`, the node was
  already completed on the server (e.g. the student also did it on another
  device). The queued attempt is still recorded but changes nothing; the UI shows
  "Already completed on the server — your offline attempt was recorded" and the
  item is dropped from the outbox.
- If the server rejects the replay with a 4xx (e.g. the lesson isn't marked
  complete), retrying can't help: the item is dropped and the UI says an offline
  attempt was discarded.
- A 5xx / network error keeps the item queued and re-registers Background Sync.
- Because both the `online` handler and a Background Sync wake could fire, a
  second replay of the same item is possible before it's deleted; that only ever
  appends an identical attempt row with an identical grade — accepted as benign.

## Notes / follow-ups (owner appends)

- SW only runs in a **production build** (`NODE_ENV === "production"` guard in
  `ServiceWorkerRegister`), so `next dev` is unaffected. Test with `next build` +
  `next start`.
- **Stale authenticated HTML on a shared offline device**: `/student/*` pages are
  runtime-cached. If user A logs out, goes offline, and user B opens `/student`,
  B could see A's cached shell until reconnect (data is still auth+RLS gated
  server-side). Low risk on a homeschool device; a clean fix is a "purge SW
  caches on sign-out" message — left as a follow-up.
- The downloaded **lesson** renders offline via the SW page cache (the lesson is
  server-rendered into the HTML). `lib/offline/store.ts` also keeps a structured
  copy in IndexedDB (`getUnit`) for a future "read from IndexedDB when the page
  HTML isn't cached" path and for the "Available offline" badge.
- No new npm dependency. SW and IndexedDB are hand-rolled per the brief.
