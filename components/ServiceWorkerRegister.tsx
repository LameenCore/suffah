"use client";

// Registers the service worker (T61) and owns outbox-flush coordination.
//
// Draining strategy: when Background Sync is available we let the SW do the
// replay (it runs even with no tab open); otherwise, and also whenever the tab
// regains connectivity, we nudge the SW to replay now. The SW is the single
// drainer, so the page never POSTs queued attempts itself.

import { useEffect } from "react";
import { readOutbox } from "@/lib/offline/store";

const SYNC_TAG = "suffa-checkpoint-sync";

async function requestFlush() {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg) return;
  if ((await readOutbox()).length === 0) return;

  if ("sync" in reg) {
    try {
      await (reg as ServiceWorkerRegistration & { sync: { register(t: string): Promise<void> } }).sync.register(
        SYNC_TAG,
      );
      return;
    } catch {
      /* fall through to an immediate nudge */
    }
  }
  navigator.serviceWorker.controller?.postMessage({ type: "SUFFA_SYNC_NOW" });
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(() => requestFlush())
      .catch(() => {
        /* SW unsupported / blocked — the app still works online */
      });

    const onOnline = () => {
      window.dispatchEvent(new Event("suffa:online"));
      void requestFlush();
    };
    const onMessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (data.type === "SUFFA_SYNC_RESULT") {
        window.dispatchEvent(new CustomEvent("suffa:sync-result", { detail: data }));
      }
    };

    window.addEventListener("online", onOnline);
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("online", onOnline);
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  return null;
}
