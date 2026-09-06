"use client";

// Online/offline pill for the playground (T61). Also surfaces how many checkpoint
// attempts are waiting to sync, and a one-line notice when the SW reports back.

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { outboxCount } from "@/lib/offline/store";

export function OfflineIndicator() {
  const t = useT();
  // Node 21+ defines a global `navigator` (without `onLine`), so a
  // `typeof navigator` check is not enough to keep SSR and the first client
  // render identical. Start "mounted = false" and render nothing until the
  // effect runs on the client — that guarantees no hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setOnline(navigator.onLine);
    const refreshPending = () => outboxCount().then(setPending).catch(() => {});
    refreshPending();

    const on = () => {
      setOnline(true);
      refreshPending();
    };
    const off = () => setOnline(false);
    const onResult = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      refreshPending();
      if (d.ok && d.superseded) setNotice(t("offline.syncSuperseded"));
      else if (d.ok) setNotice(t("offline.syncOk"));
      else if (d.dropped) setNotice(t("offline.syncDropped"));
      window.setTimeout(() => setNotice(null), 6000);
    };

    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("suffa:sync-result", onResult as EventListener);
    const poll = window.setInterval(refreshPending, 5000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("suffa:sync-result", onResult as EventListener);
      window.clearInterval(poll);
    };
  }, [t]);

  if (!mounted || (online && pending === 0 && !notice)) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
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
