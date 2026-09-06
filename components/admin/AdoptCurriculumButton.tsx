"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adoptSharedCurriculumAction } from "@/app/admin/authoring/actions";
import { useT } from "@/lib/i18n/client";

export function AdoptCurriculumButton() {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const r = await adoptSharedCurriculumAction();
            if (r.ok) router.refresh();
            else setError(r.error ?? t("admin.adopt.error"));
          });
        }}
        className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong disabled:opacity-60"
      >
        {pending ? t("admin.adopt.pending") : t("admin.adopt.cta")}
      </button>
      <p className="text-xs text-ink-4">{t("admin.adopt.note")}</p>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
