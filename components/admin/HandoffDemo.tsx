"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BriefingView } from "@/components/admin/BriefingView";
import { Button } from "@/components/ui/Button";
import { useT } from "@/lib/i18n/client";
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
      className={`rounded-[var(--radius-lg)] border p-5 transition-colors ${
        active
          ? "border-teal/50 bg-surface shadow-[var(--shadow-card)]"
          : "border-border bg-surface-2/60"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
            done
              ? "bg-teal text-white"
              : active
                ? "bg-terracotta-soft text-terracotta-strong"
                : "bg-surface-2 text-ink-4"
          }`}
        >
          {done ? "✓" : n}
        </span>
        <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

export function HandoffDemo({ state }: { state: HandoffDemoState }) {
  const t = useT();
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
        {t("admin.handoff.podNotFound")} <code>npm run seed</code> ·{" "}
        <code>npm run seed:continuity</code>
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
        setError(e instanceof Error ? e.message : t("admin.handoff.actionFailed"));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius)] border border-border bg-surface-2 px-3.5 py-2.5 text-sm">
        <span className="text-ink-2">
          <span className="font-medium text-ink">{state.pod.name}</span> &middot;{" "}
          {state.currentVolunteer ? (
            <>
              {t("admin.handoff.volunteerPrefix")}{" "}
              <span className="font-medium text-ink">{state.currentVolunteer.name}</span>
            </>
          ) : (
            <span className="font-medium text-danger">{t("admin.handoff.noVolunteer")}</span>
          )}
        </span>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(async () => {
              await resetHandoffDemoAction();
              setFreshBriefing(null);
              setPick("");
              router.refresh();
            })
          }
        >
          {t("admin.handoff.reset")}
        </Button>
      </div>

      {error ? <p className="text-xs text-danger">{error}</p> : null}

      <Step n={1} title={t("admin.handoff.step1Title")} active={online} done={offline}>
        <p className="text-sm text-ink-2 ">
          {t("admin.handoff.step1Body", {
            name: state.currentVolunteer?.name ?? t("admin.handoff.theVolunteer"),
            pod: state.pod.name,
          })}
        </p>
      </Step>

      <Step n={2} title={t("admin.handoff.step2Title")} active={online} done={offline}>
        <p className="text-sm text-ink-2 ">{t("admin.handoff.step2Body")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button
            variant="danger"
            size="sm"
            disabled={pending || offline}
            onClick={() => run(async () => { await takeVolunteerOfflineAction(); router.refresh(); })}
          >
            {offline ? t("admin.handoff.isOffline") : t("admin.handoff.takeOffline")}
          </Button>
          <span className={`text-xs ${state.playgroundOnline ? "text-success" : "text-ink-4"}`}>
            &bull; {t("admin.handoff.playgroundLabel")}{" "}
            {state.playgroundOnline
              ? t("admin.handoff.playgroundOnline")
              : t("admin.handoff.playgroundNoLesson")}{" "}
            <Link href="/student" target="_blank" className="underline underline-offset-2">
              {t("admin.handoff.openIt")}
            </Link>
          </span>
        </div>
        {offline ? (
          <p className="mt-2 text-xs text-ink-3 ">{t("admin.handoff.step2Note")}</p>
        ) : null}
      </Step>

      <Step n={3} title={t("admin.handoff.step3Title")} active={offline} done={reassigned}>
        <p className="text-sm text-ink-2 ">{t("admin.handoff.step3Body")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            disabled={pending || online}
            className="rounded-[var(--radius)] border border-border bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal disabled:opacity-55"
          >
            <option value="">{t("admin.handoff.chooseVolunteer")}</option>
            {state.candidates.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
                {v.status !== "active" ? ` (${v.status})` : ""}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            disabled={pending || !pick || online}
            onClick={() =>
              run(async () => {
                const r = await assignReplacementAction(pick);
                setFreshBriefing(r);
                router.refresh();
              })
            }
          >
            {pending ? t("admin.handoff.handingOff") : t("admin.handoff.assignGenerate")}
          </Button>
        </div>

        {freshBriefing ? (
          <div className="mt-3">
            <BriefingView
              briefing={freshBriefing.briefing}
              meta={{ source: freshBriefing.source, generatedAt: freshBriefing.generatedAt }}
              t={t}
            />
          </div>
        ) : state.latestBriefingAt && online ? (
          <p className="mt-2 text-xs text-ink-3 ">
            {t("admin.handoff.briefingExists")}{" "}
            <Link href="/admin/continuity" className="underline underline-offset-2">
              {t("admin.handoff.seeOnContinuity")}
            </Link>
            .
          </p>
        ) : null}
      </Step>
    </div>
  );
}
