"use client";

import { useRef, useState, useTransition } from "react";
import {
  addVolunteerAction,
  recordDepartureAction,
  reinstateVolunteerAction,
  setVolunteerStatusAction,
  type ActionResult,
} from "@/app/admin/volunteers/actions";
import type { VolunteerRow } from "@/lib/db/volunteer-queries";
import type { VolunteerStatus } from "@/lib/types";

const STATUS_LABEL: Record<VolunteerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  pending_vetting: "Pending vetting",
};

const STATUS_STYLE: Record<VolunteerStatus, string> = {
  active: "bg-teal-soft text-teal-strong  ",
  inactive: "bg-surface-2 text-ink-2  ",
  pending_vetting: "bg-warning-soft text-ink-2  ",
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });

const tenure = (fromIso: string, toIso: string) => {
  const days = Math.round(
    (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000,
  );
  if (days < 31) return `${days} days`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
};

function useAction() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dispatch = (fn: () => Promise<ActionResult>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "action failed");
      else onOk?.();
    });
  };
  return { pending, error, dispatch };
}

function OnboardForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const { pending, error, dispatch } = useAction();

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        dispatch(() => addVolunteerAction(fd), () => formRef.current?.reset());
      }}
      className="rounded-xl border border-border bg-surface p-4  "
    >
      <h2 className="font-medium">Onboard a volunteer</h2>
      <p className="mt-1 text-xs text-ink-3 ">
        New volunteers start as <em>pending vetting</em>. Vetting is simulated for the
        demo - no real background check.
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-ink-3 ">
            Name
          </label>
          <input
            name="name"
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            placeholder="Br. / Sr. …"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-3 ">
            Certification / background note
          </label>
          <textarea
            name="certificationNote"
            rows={2}
            className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            placeholder="e.g. CEGEP math tutor; reference check on file (mock)."
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-strong disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add volunteer"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </form>
  );
}

function ActiveRow({ v }: { v: VolunteerRow }) {
  const { pending, error, dispatch } = useAction();
  const otherStatuses = (["active", "pending_vetting", "inactive"] as VolunteerStatus[]).filter(
    (s) => s !== v.status,
  );

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="font-medium">{v.name}</span>
          <span
            className={`ml-2 rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[v.status]}`}
          >
            {STATUS_LABEL[v.status]}
          </span>
          {v.pods.length > 0 && (
            <span className="ml-2 text-xs text-ink-4">
              covering {v.pods.join(", ")}
            </span>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          {otherStatuses.map((s) => (
            <button
              key={s}
              type="button"
              disabled={pending}
              onClick={() => dispatch(() => setVolunteerStatusAction(v.id, s))}
              className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2 disabled:opacity-50  "
            >
              → {STATUS_LABEL[s]}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => dispatch(() => recordDepartureAction(v.id))}
            className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger-soft disabled:opacity-50   "
          >
            Record departure
          </button>
        </div>
      </div>
      {v.certificationNote && (
        <p className="mt-1 text-xs text-ink-3 ">{v.certificationNote}</p>
      )}
      <p className="mt-0.5 text-xs text-ink-4">joined {fmtDate(v.joinedAt)}</p>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </li>
  );
}

function ChurnedRow({ v }: { v: VolunteerRow }) {
  const { pending, error, dispatch } = useAction();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <div>
        <span className="font-medium">{v.name}</span>
        <span className="ml-2 text-xs text-ink-4">
          {fmtDate(v.joinedAt)} – {v.leftAt ? fmtDate(v.leftAt) : "-"}
          {v.leftAt ? ` · ${tenure(v.joinedAt, v.leftAt)}` : ""}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-danger">{error}</span>}
        <button
          type="button"
          disabled={pending}
          onClick={() => dispatch(() => reinstateVolunteerAction(v.id))}
          className="rounded border border-border px-2 py-1 text-xs hover:bg-surface-2 disabled:opacity-50  "
        >
          Reinstate
        </button>
      </div>
    </li>
  );
}

export function VolunteerManager({
  active,
  churned,
}: {
  active: VolunteerRow[];
  churned: VolunteerRow[];
}) {
  return (
    <div className="space-y-6">
      <OnboardForm />

      <section className="rounded-xl border border-border bg-surface p-4  ">
        <h2 className="font-medium">Current volunteers</h2>
        {active.length === 0 ? (
          <p className="mt-2 text-sm text-ink-4">No active volunteers.</p>
        ) : (
          <ul className="mt-1 divide-y divide-black/5 dark:divide-white/10">
            {active.map((v) => (
              <ActiveRow key={v.id} v={v} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-4  ">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Churn log</h2>
          <span className="text-xs text-ink-3 ">
            {churned.length} departure{churned.length === 1 ? "" : "s"}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-3 ">
          When a volunteer leaves, their pods are detached but keep their place in the
          curriculum - a replacement picks up from the same node.
        </p>
        {churned.length === 0 ? (
          <p className="mt-2 text-sm text-ink-4">No departures recorded.</p>
        ) : (
          <ul className="mt-1 divide-y divide-black/5 dark:divide-white/10">
            {churned.map((v) => (
              <ChurnedRow key={v.id} v={v} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
