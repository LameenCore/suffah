"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BriefingView } from "@/components/admin/BriefingView";
import {
  takeVolunteerOfflineAction,
  assignReplacementAction,
  resetHandoffDemoAction,
} from "@/app/admin/handoff-demo/actions";
import type { HandoffDemoState } from "@/lib/db/continuity-queries";
import type { PodBriefing } from "@/lib/ai/continuity";

function Step({
  n,
  title,
  active,
  done,
  children,
}: {
  n: number;
  title: string;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-emerald-400 bg-surface  "
          : "border-border bg-surface-2/60  /40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
            done
              ? "bg-teal text-white"
              : active
                ? "bg-teal-soft text-teal-strong  "
                : "bg-zinc-200 text-ink-3 "
          }`}
        >
          {done ? "✓" : n}
        </span>
        <h2 className="text-sm font-medium">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function HandoffDemo({ state }: { state: HandoffDemoState }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [freshBriefing, setFreshBriefing] = useState<{
    briefing: PodBriefing;
    source: string;
    generatedAt: string;
  } | null>(null);
  const [pick, setPick] = useState("");

  if (!state.pod) {
    return (
      <p className="rounded-xl border border-warning/40 bg-warning-soft p-4 text-sm text-ink-2   ">
        Demo pod not found. Run <code>npm run seed</code> then <code>npm run seed:continuity</code>.
      </p>
    );
  }

  const online = Boolean(state.currentVolunteer);
  const offline = !state.currentVolunteer;
  // "assigned again" once a volunteer is back AND a briefing exists (this run or prior)
  const reassigned = Boolean(state.currentVolunteer) && (freshBriefing != null);

  function run(fn: () => Promise<unknown>) {
    startTransition(async () => {
      setError(null);
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "action failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm ">
        <span>
          <span className="font-medium">{state.pod.name}</span> ·{" "}
          {state.currentVolunteer ? (
            <>volunteer: <span className="font-medium">{state.currentVolunteer.name}</span></>
          ) : (
            <span className="font-medium text-red-600 dark:text-red-400">no volunteer</span>
          )}
        </span>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await resetHandoffDemoAction();
              setFreshBriefing(null);
              setPick("");
              router.refresh();
            })
          }
          className="rounded-md border border-border px-2.5 py-1 text-xs text-ink-2 hover:bg-surface   "
        >
          Reset demo
        </button>
      </div>

      {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}

      <Step n={1} title="A live session is running" active={online} done={offline}>
        <p className="text-sm text-ink-2 ">
          {state.currentVolunteer?.name ?? "The volunteer"} is leading{" "}
          {state.pod.name}&apos;s enrichment session. The playground is delivering
          the actual curriculum underneath.
        </p>
      </Step>

      <Step n={2} title="The volunteer goes offline" active={online} done={offline}>
        <p className="text-sm text-ink-2 ">
          High volunteer churn is the core operational pain. Simulate it:
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={pending || offline}
            onClick={() => run(async () => { await takeVolunteerOfflineAction(); router.refresh(); })}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            {offline ? "Volunteer is offline" : "Take volunteer offline"}
          </button>
          <span
            className={`text-xs ${
              state.playgroundOnline
                ? "text-teal "
                : "text-ink-4"
            }`}
          >
            ● Student playground: {state.playgroundOnline ? "online - the pod keeps learning" : "no lesson ready"}
            {"  "}
            <Link href="/student" target="_blank" className="underline underline-offset-2">
              open it
            </Link>
          </span>
        </div>
        {offline ? (
          <p className="mt-2 text-xs text-ink-3 ">
            The pod&apos;s <code>pod_progress</code> is untouched - nothing was lost, and the
            students never stopped.
          </p>
        ) : null}
      </Step>

      <Step n={3} title="A new volunteer picks up - with a briefing" active={offline} done={reassigned}>
        <p className="text-sm text-ink-2 ">
          The incoming volunteer doesn&apos;t start cold. Assign them and the Continuity
          Fingerprint generates a handoff briefing from the pod&apos;s real history.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            disabled={pending || online}
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm  "
          >
            <option value="">Choose a volunteer…</option>
            {state.candidates.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.status !== "active" ? ` (${v.status})` : ""}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={pending || !pick || online}
            onClick={() =>
              run(async () => {
                const r = await assignReplacementAction(pick);
                setFreshBriefing(r);
                router.refresh();
              })
            }
            className="rounded-lg bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-strong disabled:opacity-50"
          >
            {pending ? "Handing off…" : "Assign + generate briefing"}
          </button>
        </div>

        {freshBriefing ? (
          <div className="mt-3">
            <BriefingView
              briefing={freshBriefing.briefing}
              meta={{ source: freshBriefing.source, generatedAt: freshBriefing.generatedAt }}
            />
          </div>
        ) : state.latestBriefingAt && online ? (
          <p className="mt-2 text-xs text-ink-3 ">
            A briefing already exists for this pod.{" "}
            <Link href="/admin/continuity" className="underline underline-offset-2">
              See it on the Continuity Fingerprint view
            </Link>
            .
          </p>
        ) : null}
      </Step>
    </div>
  );
}
