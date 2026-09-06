"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { MasjidApplication } from "@/lib/platform/applications";
import { approveApplicationAction, rejectApplicationAction } from "./actions";

export function ApplicationCard({ app }: { app: MasjidApplication }) {
  const [pending, start] = useTransition();
  const [creds, setCreds] = useState<{ email: string; pw: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);

  const status = done ?? app.status;

  return (
    <Card as="section" className="space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-base font-semibold text-ink">{app.masjidName}</h3>
        {status === "pending" ? (
          <Badge tone="warning">Pending</Badge>
        ) : status === "approved" ? (
          <Badge tone="success">Approved</Badge>
        ) : (
          <Badge tone="danger">Rejected</Badge>
        )}
        <span className="text-xs text-ink-4">
          {new Date(app.createdAt).toLocaleDateString()}
        </span>
      </div>

      <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-ink-4">Contact</dt>
          <dd className="text-ink-2">
            {app.contactName} · {app.contactEmail}
          </dd>
        </div>
        {app.city ? (
          <div>
            <dt className="text-xs uppercase tracking-wide text-ink-4">City</dt>
            <dd className="text-ink-2">{app.city}</dd>
          </div>
        ) : null}
      </dl>
      {app.note ? <p className="text-sm text-ink-3">&ldquo;{app.note}&rdquo;</p> : null}

      {creds ? (
        <div className="rounded-[var(--radius)] border border-teal/30 bg-teal-soft p-3 text-sm text-teal-strong">
          <p className="font-semibold">Masjid provisioned. Share these once:</p>
          <p className="mt-1 font-mono text-xs">
            {creds.email}
            <br />
            {creds.pw}
          </p>
          <p className="mt-1 text-xs">The admin should change the password after first sign-in.</p>
        </div>
      ) : null}
      {error ? (
        <p className="rounded-[var(--radius)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-[color:var(--ink)]">
          {error}
        </p>
      ) : null}

      {status === "pending" ? (
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3">
          <label className="text-sm">
            <span className="text-ink-2">Default language</span>
            <select
              name="defaultLocale"
              defaultValue="fr"
              id={`locale-${app.id}`}
              className="mt-1 block rounded-[var(--radius)] border border-border bg-bg px-2 py-1.5 text-sm text-ink"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              const fd = new FormData();
              fd.set("id", app.id);
              fd.set(
                "defaultLocale",
                (document.getElementById(`locale-${app.id}`) as HTMLSelectElement)?.value ?? "fr",
              );
              start(async () => {
                const r = await approveApplicationAction(fd);
                if (r.ok) {
                  setCreds({ email: r.result.adminEmail, pw: r.result.tempPassword });
                  setDone("approved");
                } else {
                  setError(r.error);
                }
              });
            }}
            className="rounded-full bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong disabled:opacity-60"
          >
            {pending ? "Provisioning…" : "Approve & provision"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("id", app.id);
              start(async () => {
                await rejectApplicationAction(fd);
                setDone("rejected");
              });
            }}
            className="rounded-full border border-border-strong bg-surface px-4 py-2 text-sm text-ink-2 transition-colors hover:border-danger hover:text-danger disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      ) : app.reviewNote ? (
        <p className="border-t border-border pt-3 text-sm text-ink-3">
          Note: {app.reviewNote}
        </p>
      ) : null}
    </Card>
  );
}
