"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { QueueItem } from "@/lib/db/board-queries";
import { moderateAction } from "@/app/admin/board/actions";

export function ModerationQueue({ items }: { items: QueueItem[] }) {
  const t = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(postId: string, action: "release" | "hide") {
    setError(null);
    const fd = new FormData();
    fd.set("postId", postId);
    fd.set("action", action);
    start(async () => {
      const r = await moderateAction(fd);
      if (r?.error) setError(r.error);
      else router.refresh();
    });
  }

  if (items.length === 0) {
    return (
      <Card className="p-6 text-sm text-ink-3">{t("moderation.empty")}</Card>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-[color:var(--ink)]">
          {error}
        </p>
      ) : null}
      {items.map((p) => (
        <Card key={p.id} as="section" className="space-y-2 p-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-4">
            <Badge tone={p.flagReason === "reported" ? "warning" : "danger"}>
              {t(`moderation.reason.${p.flagReason ?? "manual"}` as never)}
            </Badge>
            <span>{p.podName}</span>
            <span>
              {p.authorName} · {p.authorRole}
            </span>
            <span>{new Date(p.createdAt).toLocaleString()}</span>
            {p.reports > 0 ? (
              <span className="text-danger">{t("moderation.reports", { n: p.reports })}</span>
            ) : null}
            {p.threadId ? <span>{t("moderation.isReply")}</span> : null}
          </div>
          <p className="whitespace-pre-line text-sm text-ink-2">{p.body}</p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => act(p.id, "release")}
              className="rounded-full bg-teal px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-teal-strong disabled:opacity-60"
            >
              {t("moderation.release")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => act(p.id, "hide")}
              className="rounded-full border border-border-strong bg-surface px-4 py-1.5 text-xs text-ink-2 transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
            >
              {t("moderation.hide")}
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
