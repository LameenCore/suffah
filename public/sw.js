/* Suffa service worker (T61) — hand-rolled, no build step.
 *
 * - App-shell + static caching so the playground opens with the network down.
 * - Navigations: network-first, fall back to cache, then to /offline.
 * - /_next/static + generated icons: cache-first (immutable, hashed).
 * - API / auth / everything else: passed straight through (never cached).
 * - Background Sync: on `suffa-checkpoint-sync`, replay queued checkpoint
 *   attempts from IndexedDB to /api/checkpoints/grade and tell open clients.
 *
 * Bump CACHE_VERSION to invalidate old caches on the next activate.
 */

const CACHE_VERSION = "suffa-v1";
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const OFFLINE_URL = "/offline";
const SYNC_TAG = "suffa-checkpoint-sync";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll([OFFLINE_URL, "/manifest.webmanifest"]))
      .catch(() => {
        /* offline install on a fresh SW — the fetch handler still degrades */
      }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.startsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/pwa-icon/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:css|js|woff2?|png|svg|ico)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never cache API, auth, or Server Action traffic.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate") {
    // Only the student playground is stored for offline reads — it's the only
    // surface meant to work offline, and it keeps cached authenticated HTML off
    // every other route. Always network-first, so an online view is fresh.
    const cacheable = url.pathname === "/student" || url.pathname.startsWith("/student/");
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (cacheable && res.ok) {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || (await caches.match(OFFLINE_URL)) || Response.error();
        }),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      }),
    );
  }
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "SUFFA_SYNC_NOW") {
    event.waitUntil(replayOutbox());
  }
});

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) event.waitUntil(replayOutbox());
});

// ---- IndexedDB outbox replay (mirrors lib/offline/store.ts) ----------------

function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("suffa-offline", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("units")) db.createObjectStore("units", { keyPath: "nodeId" });
      if (!db.objectStoreNames.contains("outbox")) db.createObjectStore("outbox", { keyPath: "nodeId" });
      if (!db.objectStoreNames.contains("drafts")) db.createObjectStore("drafts", { keyPath: "nodeId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idb(db, store, mode, run) {
  return new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const r = run(t.objectStore(store));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function replayOutbox() {
  let db;
  try {
    db = await openOfflineDb();
  } catch {
    return;
  }
  let items = [];
  try {
    items = (await idb(db, "outbox", "readonly", (s) => s.getAll())) || [];
  } catch {
    return;
  }

  let stillOffline = false;
  for (const item of items) {
    try {
      const res = await fetch("/api/checkpoints/grade", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nodeId: item.nodeId, answers: item.answers }),
      });
      if (res.ok) {
        const grade = await res.json().catch(() => ({}));
        await idb(db, "outbox", "readwrite", (s) => s.delete(item.nodeId));
        await notifyClients({
          type: "SUFFA_SYNC_RESULT",
          nodeId: item.nodeId,
          ok: true,
          superseded: grade && grade.alreadyPassed === true,
          passed: !!(grade && grade.passed),
        });
      } else if (res.status >= 400 && res.status < 500) {
        // Server rejected it for a non-transient reason (e.g. lesson not marked
        // complete). Drop it — retrying will not help — and tell the client.
        await idb(db, "outbox", "readwrite", (s) => s.delete(item.nodeId));
        await notifyClients({ type: "SUFFA_SYNC_RESULT", nodeId: item.nodeId, ok: false, dropped: true });
      } else {
        stillOffline = true;
      }
    } catch {
      stillOffline = true;
    }
  }

  if (stillOffline && "sync" in self.registration) {
    try {
      await self.registration.sync.register(SYNC_TAG);
    } catch {
      /* browser without Background Sync — the page retries on `online` */
    }
  }
}

async function notifyClients(msg) {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: "window" });
  for (const c of clients) c.postMessage(msg);
}
