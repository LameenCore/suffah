"use client";

import { useRef, useState, useTransition } from "react";
import {
  addContributionAction,
  incorporateAction,
  type ActionResult,
} from "@/app/admin/seerah/actions";
import type { Contribution } from "@/lib/db/contribution-queries";
import { useT, useIntlLocale } from "@/lib/i18n/client";

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
  const t = useT();
  const intlLocale = useIntlLocale();
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(intlLocale, { month: "short", day: "numeric" });
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  const pendingCount = contributions.filter((c) => !c.incorporated).length;

  function run(fn: () => Promise<ActionResult>, okText: string, onOk?: () => void) {
    setMsg(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setMsg({ kind: "err", text: res.error ?? t("admin.seerah.actionFailed") });
      else {
        setMsg({
          kind: "ok",
          text: res.version
            ? t("admin.seerah.versionResult", { text: okText, v: res.version })
            : okText,
        });
        onOk?.();
      }
    });
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-border bg-surface p-4  ">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-medium">
            {t("admin.seerah.contributionsTitle", { node: nodeTitle })}
          </h2>
          <span className="text-xs text-ink-3 ">
            {t("admin.seerah.lessonVLabel", { v: version })}
            {version > 1 ? t("admin.seerah.lessonVRevised") : ""}
          </span>
        </div>

        {contributions.length === 0 ? (
          <p className="mt-2 text-sm text-ink-4">{t("admin.seerah.noContributions")}</p>
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
                    {c.incorporated
                      ? t("admin.seerah.incorporated")
                      : t("admin.seerah.pending")}
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
              t(
                pendingCount === 1
                  ? "admin.seerah.incorporatedCountOne"
                  : "admin.seerah.incorporatedCountMany",
                { n: pendingCount },
              ),
            )
          }
          className="mt-3 rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-strong disabled:opacity-50"
        >
          {pending
            ? t("admin.seerah.working")
            : pendingCount === 0
              ? t("admin.seerah.noPending")
              : t(
                  pendingCount === 1
                    ? "admin.seerah.incorporateCtaOne"
                    : "admin.seerah.incorporateCtaMany",
                  { n: pendingCount },
                )}
        </button>
      </section>

      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          run(() => addContributionAction(fd), t("admin.seerah.contributionAdded"), () =>
            formRef.current?.reset(),
          );
        }}
        className="rounded-xl border border-border bg-surface p-4  "
      >
        <h2 className="font-medium">{t("admin.seerah.addTitle")}</h2>
        <p className="mt-1 text-xs text-ink-3 ">{t("admin.seerah.addLede")}</p>
        <input type="hidden" name="nodeId" value={nodeId} />
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">
              {t("admin.seerah.fieldName")}
            </span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            />
          </label>
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">
              {t("admin.seerah.fieldRole")}
            </span>
            <input
              name="role"
              placeholder={t("admin.seerah.rolePlaceholder")}
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="text-xs font-medium text-ink-3 ">
            {t("admin.seerah.fieldNote")}
          </span>
          <textarea
            name="note"
            rows={3}
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            placeholder={t("admin.seerah.notePlaceholder")}
          />
        </label>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-surface-2 disabled:opacity-50  "
          >
            {pending ? t("admin.seerah.saving") : t("admin.seerah.addContribution")}
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
