"use client";

import { useRef, useState, useTransition } from "react";
import {
  addContributionAction,
  incorporateAction,
  type ActionResult,
} from "@/app/admin/seerah/actions";
import type { Contribution } from "@/lib/db/contribution-queries";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", day: "numeric" });

export function SeerahContributions({
  nodeId,
  nodeTitle,
  version,
  contributions,
}: {
  nodeId: string;
  nodeTitle: string;
  version: number;
  contributions: Contribution[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  const pendingCount = contributions.filter((c) => !c.incorporated).length;

  function run(fn: () => Promise<ActionResult>, okText: string, onOk?: () => void) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setMsg({ kind: "err", text: res.error ?? "action failed" });
      else {
        setMsg({
          kind: "ok",
          text: res.version ? `${okText} - lesson is now version ${res.version}.` : okText,
        });
        onOk?.();
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-surface p-4  ">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">Contributions · {nodeTitle}</h2>
          <span className="text-xs text-ink-3 ">
            lesson v{version}
            {version > 1 ? " · revised with community input" : ""}
          </span>
        </div>

        {contributions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-4">No contributions yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-black/5 dark:divide-white/10">
            {contributions.map((c) => (
              <li key={c.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">{c.contributorName}</span>
                  {c.contributorRole && (
                    <span className="text-xs text-ink-4">{c.contributorRole}</span>
                  )}
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                      c.incorporated
                        ? "bg-teal-soft text-teal-strong  "
                        : "bg-warning-soft text-ink-2  "
                    }`}
                  >
                    {c.incorporated ? "incorporated" : "pending"}
                  </span>
                  <span className="text-xs text-ink-4">{fmtDate(c.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-ink-2 ">{c.note}</p>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          disabled={pending || pendingCount === 0}
          onClick={() =>
            run(
              () => incorporateAction(nodeId),
              `Incorporated ${pendingCount} contribution${pendingCount === 1 ? "" : "s"}`,
            )
          }
          className="mt-3 rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-strong disabled:opacity-50"
        >
          {pending
            ? "Working…"
            : pendingCount === 0
              ? "No pending contributions"
              : `Incorporate ${pendingCount} pending → new lesson version`}
        </button>
      </section>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          run(() => addContributionAction(fd), "Contribution added", () =>
            formRef.current?.reset(),
          );
        }}
        className="rounded-xl border border-border bg-surface p-4  "
      >
        <h2 className="font-medium">Add a contribution</h2>
        <p className="mt-1 text-xs text-ink-3 ">
          A scholar or elder&apos;s note on this lesson draft. Text for the demo; voice
          capture is the productionization step.
        </p>
        <input type="hidden" name="nodeId" value={nodeId} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">Name</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">
              Role (optional)
            </span>
            <input
              name="role"
              placeholder="imam · elder · hafiz"
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="text-xs font-medium text-ink-3 ">Note</span>
          <textarea
            name="note"
            rows={3}
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            placeholder="e.g. Mention the boycott of Banu Hashim here."
          />
        </label>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-2 disabled:opacity-50  "
          >
            {pending ? "Saving…" : "Add contribution"}
          </button>
          {msg && (
            <span
              className={`text-xs ${
                msg.kind === "err"
                  ? "text-danger"
                  : "text-teal-strong "
              }`}
            >
              {msg.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
