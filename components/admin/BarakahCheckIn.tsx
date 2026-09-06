"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  addBarakahNoteAction,
  type ActionResult,
} from "@/app/admin/barakah/actions";
import {
  BARAKAH_INDICATORS,
  type BarakahEntry,
  type BarakahIndicator,
} from "@/lib/db/barakah-queries";
import { useT, useIntlLocale } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n";

export interface PodOption {
  id: string;
  name: string;
  students: { id: string; name: string }[];
}

const IND_KEY: Record<BarakahIndicator, MessageKey> = {
  attendance: "admin.barakah.indAttendance",
  cooperation: "admin.barakah.indCooperation",
  reflection: "admin.barakah.indReflection",
  adab: "admin.barakah.indAdab",
};

export function BarakahCheckIn({
  pods,
  recentNotes,
}: {
  pods: PodOption[];
  recentNotes: BarakahEntry[];
}) {
  const t = useT();
  const intlLocale = useIntlLocale();
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(intlLocale, { month: "short", day: "numeric" });
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [podId, setPodId] = useState(pods[0]?.id ?? "");

  const students = useMemo(
    () => pods.find((p) => p.id === podId)?.students ?? [],
    [pods, podId],
  );

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError(null);
    start(async () => {
      const res: ActionResult = await addBarakahNoteAction(fd);
      if (!res.ok) setError(res.error ?? t("admin.barakah.actionFailed"));
      else {
        formRef.current?.reset();
        setPodId(pods[0]?.id ?? "");
      }
    });
  }

  return (
    <div className="space-y-6">
      <form
        ref={formRef}
        onSubmit={submit}
        className="rounded-xl border border-border bg-surface p-4  "
      >
        <h2 className="font-medium">{t("admin.barakah.formTitle")}</h2>
        <p className="mt-1 text-xs text-ink-3 ">{t("admin.barakah.formLede")}</p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">
              {t("admin.barakah.fieldPod")}
            </span>
            <select
              name="podId"
              value={podId}
              onChange={(e) => setPodId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            >
              {pods.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">
              {t("admin.barakah.fieldAbout")}
            </span>
            <select
              name="studentUserId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            >
              <option value="">{t("admin.barakah.wholePod")}</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">
              {t("admin.barakah.fieldIndicator")}
            </span>
            <select
              name="indicator"
              defaultValue={BARAKAH_INDICATORS[0].key}
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            >
              {BARAKAH_INDICATORS.map((i) => (
                <option key={i.key} value={i.key}>{t(IND_KEY[i.key])}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-xs font-medium text-ink-3 ">
              {t("admin.barakah.fieldRecordedBy")}
            </span>
            <input
              name="recordedBy"
              defaultValue="Br. Kareem"
              className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            />
          </label>
        </div>

        <label className="mt-3 block text-sm">
          <span className="text-xs font-medium text-ink-3 ">
            {t("admin.barakah.fieldNote")}
          </span>
          <textarea
            name="note"
            rows={2}
            required
            className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
            placeholder={t("admin.barakah.notePlaceholder")}
          />
        </label>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-strong disabled:opacity-50"
          >
            {pending ? t("admin.barakah.saving") : t("admin.barakah.recordNote")}
          </button>
          {error && <span className="text-xs text-danger">{error}</span>}
        </div>
      </form>

      <section className="rounded-xl border border-border bg-surface p-4  ">
        <h2 className="font-medium">{t("admin.barakah.recentTitle")}</h2>
        {recentNotes.length === 0 ? (
          <p className="mt-2 text-sm text-ink-4">{t("admin.barakah.recentNone")}</p>
        ) : (
          <ul className="mt-1 divide-y divide-black/5 dark:divide-white/10">
            {recentNotes.map((n) => (
              <li key={n.id} className="py-2 text-sm">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium">
                    {n.studentName ??
                      t("admin.barakah.wholePodSuffix", { pod: n.podName })}
                  </span>
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink-2  ">
                    {t(IND_KEY[n.indicator])}
                  </span>
                  <span className="text-xs text-ink-4">
                    {fmtDate(n.recordedAt)} · {n.recordedBy}
                  </span>
                </div>
                {n.note && (
                  <p className="mt-0.5 text-ink-2 ">{n.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
