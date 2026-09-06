"use client";

// Online/offline pill for the playground (T61). Also surfaces how many checkpoint
// attempts are waiting to sync, and a one-line notice when the SW reports back.

import { useEffect, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";
import { outboxCount } from "@/lib/offline/store";

// Online status via useSyncExternalStore: the server snapshot is always "online",
// the client snapshot is navigator.onLine. This is SSR-safe (no hydration
// mismatch, no setState-in-effect) even though Node 21+ exposes a global
// `navigator` without `onLine`.
function subscribeOnline(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function OfflineIndicator() {
  const t = useT();
  const online = useSyncExternalStore(
    subscribeOnline,
    () => navigator.onLine,
    () => true,
  );
  const [pending, setPending] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const refreshPending = () => outboxCount().then(setPending).catch(() => {});
    refreshPending();

    const onResult = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      refreshPending();
      if (d.ok && d.superseded) setNotice(t("offline.syncSuperseded"));
      else if (d.ok) setNotice(t("offline.syncOk"));
      else if (d.dropped) setNotice(t("offline.syncDropped"));
      window.setTimeout(() => setNotice(null), 6000);
    };
    const onOnline = () => refreshPending();

    window.addEventListener("online", onOnline);
    window.addEventListener("suffa:sync-result", onResult as EventListener);
    const poll = window.setInterval(refreshPending, 5000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("suffa:sync-result", onResult as EventListener);
      window.clearInterval(poll);
    };
  }, [t]);

  if (online && pending === 0 && !notice) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs" role="status" aria-live="polite">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium ${
          online
            ? "bg-teal-soft text-teal-strong"
            : "bg-warning-soft text-[color:var(--ink)]"
        }`}
      >
        <span
          className={`h-1.5 w-1.5 rounded-full ${online ? "bg-teal" : "bg-warning"}`}
          aria-hidden
        />
        {online ? t("offline.online") : t("offline.offline")}
      </span>
      {pending > 0 ? (
        <span className="rounded-full bg-surface-2 px-2.5 py-1 text-ink-3">
          {t("offline.pending", { count: pending })}
        </span>
      ) : null}
      {notice ? <span className="text-ink-4">{notice}</span> : null}
    </div>
  );
}
