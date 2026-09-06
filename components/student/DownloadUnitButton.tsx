"use client";

// "Download for offline" (T61). Pulls the current unit's lesson + checkpoint from
// the API and stores it in IndexedDB. The lesson page itself is also cached by
// the service worker on first online view, so a downloaded unit reads back with
// the network down.

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { saveUnit, getUnit } from "@/lib/offline/store";

type State = "idle" | "saving" | "saved" | "error";

export function DownloadUnitButton({
  courseId,
  nodeId,
}: {
  courseId: string;
  nodeId: string;
}) {
  const t = useT();
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    let alive = true;
    getUnit(nodeId).then((u) => {
      if (alive && u) setState("saved");
    });
    return () => {
      alive = false;
    };
  }, [nodeId]);

  async function download() {
    setState("saving");
    try {
      const res = await fetch(`/api/offline/unit?courseId=${encodeURIComponent(courseId)}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      await saveUnit({
        nodeId: data.nodeId,
        courseId: data.courseId,
        courseName: data.courseName,
        title: data.title,
        lesson: data.lesson,
        checkpoint: data.checkpoint,
        savedAt: Date.now(),
      });
      // Warm the SW page cache for this route so the lesson HTML is available offline.
      void fetch(window.location.href, { credentials: "include" }).catch(() => {});
      setState("saved");
    } catch {
      setState("error");
    }
  }

  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-soft px-3 py-1 text-xs font-medium text-teal-strong">
        <span className="h-1.5 w-1.5 rounded-full bg-teal" aria-hidden />
        {t("offline.downloaded")}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={download}
      disabled={state === "saving"}
      className="inline-flex min-h-9 items-center rounded-full border border-border-strong bg-surface px-3 text-xs text-ink-2 transition-colors hover:border-teal hover:text-teal disabled:opacity-60"
    >
      {state === "saving"
        ? t("offline.downloading")
        : state === "error"
          ? t("offline.downloadRetry")
          : t("offline.download")}
    </button>
  );
}
