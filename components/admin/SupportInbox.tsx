"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resolveRequestAction, reopenRequestAction } from "@/app/admin/inbox/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { SupportRequest } from "@/lib/db/support-queries";

const CAT_TONE = {
  question: "teal",
  bug: "danger",
  idea: "mustard",
  "data-erasure": "warning",
} as const;

function Row({ req }: { req: SupportRequest }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [note, setNote] = useState(req.adminNote ?? "");
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<unknown>) {
    start(async () => {
      setError(null);
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "action failed");
      }
    });
  }

  return (
    <Card
      as="section"
      accent={req.status === "open" ? "terracotta" : undefined}
      className="p-4 pl-5"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={CAT_TONE[req.category]}>{req.category}</Badge>
        <Badge tone={req.status === "open" ? "warning" : "success"}>
          {req.status === "open" ? "Open" : "Resolved"}
        </Badge>
        <span className="text-xs text-ink-3">
          {req.fromName} · {req.fromRole} · {new Date(req.createdAt).toLocaleString()}
        </span>
      </div>

      <p className="mt-2 font-display text-base font-semibold text-ink">{req.subject}</p>
      <p className="mt-1 whitespace-pre-line text-sm text-ink-2">{req.body}</p>

      <div className="mt-3 space-y-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reply / internal note (shown to the sender)"
          rows={2}
          className="w-full resize-y rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal"
        />
        <div className="flex items-center gap-2">
          {req.status === "open" ? (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => run(() => resolveRequestAction(req.id, note))}
            >
              {pending ? "Saving..." : "Mark resolved"}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => run(() => reopenRequestAction(req.id))}
            >
              Reopen
            </Button>
          )}
          {error ? <span className="text-xs text-danger">{error}</span> : null}
        </div>
      </div>
    </Card>
  );
}

export function SupportInbox({ requests }: { requests: SupportRequest[] }) {
  const open = requests.filter((r) => r.status === "open");
  const resolved = requests.filter((r) => r.status === "resolved");

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
          Open ({open.length})
        </h2>
        {open.length === 0 ? (
          <Card className="p-6 text-sm text-ink-3">Nothing open. All caught up.</Card>
        ) : (
          open.map((r) => <Row key={r.id} req={r} />)
        )}
      </section>

      {resolved.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
            Resolved ({resolved.length})
          </h2>
          {resolved.map((r) => (
            <Row key={r.id} req={r} />
          ))}
        </section>
      ) : null}
    </div>
  );
}
