"use client";

import { useRef, useState, useTransition } from "react";
import {
  addVolunteerAction,
  linkVolunteerLoginAction,
  recordDepartureAction,
  reinstateVolunteerAction,
  setVolunteerStatusAction,
  unlinkVolunteerLoginAction,
  type ActionResult,
} from "@/app/admin/volunteers/actions";
import type { VolunteerRow } from "@/lib/db/volunteer-queries";
import type { VolunteerStatus } from "@/lib/types";
import { useT, useIntlLocale } from "@/lib/i18n/client";
import type { MessageKey, Translator } from "@/lib/i18n";

const STATUS_KEY: Record<VolunteerStatus, MessageKey> = {
  active: "admin.volunteers.statusActive",
  inactive: "admin.volunteers.statusInactive",
  pending_vetting: "admin.volunteers.statusPending",
};

const STATUS_STYLE: Record<VolunteerStatus, string> = {
  active: "bg-teal-soft text-teal-strong  ",
  inactive: "bg-surface-2 text-ink-2  ",
  pending_vetting: "bg-warning-soft text-ink-2  ",
};

const fmtDate = (iso: string, intlLocale: string) =>
  new Date(iso).toLocaleDateString(intlLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const tenure = (fromIso: string, toIso: string, t: Translator) => {
  const days = Math.round(
    (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000,
  );
  if (days < 31) return t("admin.volunteers.daysAgo", { n: days });
  const months = Math.round(days / 30);
  return t(
    months === 1 ? "admin.volunteers.monthsOne" : "admin.volunteers.monthsMany",
    { n: months },
  );
};

function useAction() {
  const t = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const dispatch = (fn: () => Promise<ActionResult>, onOk?: () => void) => {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? t("admin.volunteers.actionFailed"));
      else onOk?.();
    });
  };
  return { pending, error, dispatch };
}

function OnboardForm() {
  const t = useT();
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
      <h2 className="font-medium">{t("admin.volunteers.onboardTitle")}</h2>
      <p className="mt-1 text-xs text-ink-3 ">
        {t("admin.volunteers.onboardLedeBefore")}
        <em>{t("admin.volunteers.onboardLedePending")}</em>
        {t("admin.volunteers.onboardLedeAfter")}
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <label className="block text-xs font-medium text-ink-3 ">
            <span className="block">{t("admin.volunteers.fieldName")}</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
              placeholder={t("admin.volunteers.namePlaceholder")}
            />
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-3 ">
            <span className="block">{t("admin.volunteers.fieldCert")}</span>
            <textarea
              name="certificationNote"
              rows={2}
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
              placeholder={t("admin.volunteers.certPlaceholder")}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-strong disabled:opacity-50"
        >
          {pending ? t("admin.volunteers.adding") : t("admin.volunteers.addVolunteer")}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    </form>
  );
}

function ActiveRow({ v }: { v: VolunteerRow }) {
  const t = useT();
  const intlLocale = useIntlLocale();
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
            {t(STATUS_KEY[v.status])}
          </span>
          {v.pods.length > 0 && (
            <span className="ml-2 text-xs text-ink-4">
              {t("admin.volunteers.covering", { pods: v.pods.join(", ") })}
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
              → {t(STATUS_KEY[s])}
            </button>
          ))}
          <button
            type="button"
            disabled={pending}
            onClick={() => dispatch(() => recordDepartureAction(v.id))}
            className="rounded border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger-soft disabled:opacity-50   "
          >
            {t("admin.volunteers.recordDeparture")}
          </button>
        </div>
      </div>
      {v.certificationNote && (
        <p className="mt-1 text-xs text-ink-3 ">{v.certificationNote}</p>
      )}
      <p className="mt-0.5 text-xs text-ink-4">
        {t("admin.volunteers.joined", { date: fmtDate(v.joinedAt, intlLocale) })}
      </p>
      <LoginLink v={v} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </li>
  );
}

/** Link a volunteer record to a signed-up volunteer login (T32). */
function LoginLink({ v }: { v: VolunteerRow }) {
  const t = useT();
  const { pending, error, dispatch } = useAction();
  const [email, setEmail] = useState("");

  if (v.userId) {
    return (
      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-3">
        <span className="rounded bg-teal-soft px-1.5 py-0.5 text-teal-strong">
          {t("admin.volunteers.loginLinked")}
        </span>
        <span className="text-ink-4">{v.userEmail}</span>
        <button
          type="button"
          disabled={pending}
          onClick={() => dispatch(() => unlinkVolunteerLoginAction(v.id))}
          className="rounded border border-border px-1.5 py-0.5 hover:bg-surface-2 disabled:opacity-50"
        >
          {t("admin.volunteers.unlink")}
        </button>
        {error && <span className="text-danger">{error}</span>}
      </p>
    );
  }

  return (
    <form
      className="mt-1 flex flex-wrap items-center gap-2 text-xs"
      onSubmit={(e) => {
        e.preventDefault();
        dispatch(() => linkVolunteerLoginAction(v.id, email), () => setEmail(""));
      }}
    >
      <span className="text-ink-4">{t("admin.volunteers.noLoginYet")}</span>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("admin.volunteers.theirEmail")}
        className="min-w-[12rem] rounded border border-border bg-surface px-2 py-1"
      />
      <button
        type="submit"
        disabled={pending || !email.trim()}
        className="rounded border border-border px-2 py-1 hover:bg-surface-2 disabled:opacity-50"
      >
        {t("admin.volunteers.linkLogin")}
      </button>
      {error && <span className="text-danger">{error}</span>}
    </form>
  );
}

function ChurnedRow({ v }: { v: VolunteerRow }) {
  const t = useT();
  const intlLocale = useIntlLocale();
  const { pending, error, dispatch } = useAction();
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <div>
        <span className="font-medium">{v.name}</span>
        <span className="ml-2 text-xs text-ink-4">
          {fmtDate(v.joinedAt, intlLocale)} –{" "}
          {v.leftAt ? fmtDate(v.leftAt, intlLocale) : "-"}
          {v.leftAt ? ` · ${tenure(v.joinedAt, v.leftAt, t)}` : ""}
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
          {t("admin.volunteers.reinstate")}
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
  const t = useT();
  return (
    <div className="space-y-6">
      <OnboardForm />

      <section className="rounded-xl border border-border bg-surface p-4  ">
        <h2 className="font-medium">{t("admin.volunteers.currentTitle")}</h2>
        {active.length === 0 ? (
          <p className="mt-2 text-sm text-ink-4">{t("admin.volunteers.noActive")}</p>
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
          <h2 className="font-medium">{t("admin.volunteers.churnTitle")}</h2>
          <span className="text-xs text-ink-3 ">
            {t(
              churned.length === 1
                ? "admin.volunteers.departuresOne"
                : "admin.volunteers.departuresMany",
              { n: churned.length },
            )}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-3 ">{t("admin.volunteers.churnLede")}</p>
        {churned.length === 0 ? (
          <p className="mt-2 text-sm text-ink-4">{t("admin.volunteers.noDepartures")}</p>
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
