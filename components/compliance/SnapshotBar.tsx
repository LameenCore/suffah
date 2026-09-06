"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSnapshotAction } from "@/app/admin/compliance/actions";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useT, useIntlLocale } from "@/lib/i18n/client";

export function SnapshotBar({
  studentId,
  studentName,
  lastSnapshotAt,
}: {
  studentId: string;
  studentName: string;
  lastSnapshotAt: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const t = useT();
  const intlLocale = useIntlLocale();

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-border bg-surface-2 px-3 py-2.5">
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await generateSnapshotAction(studentId, studentName);
            router.refresh();
          })
        }
      >
        {pending ? t("compliance.snapshot.saving") : t("compliance.snapshot.save")}
      </Button>
      <ButtonLink
        size="sm"
        variant="ghost"
        href={`/print/compliance/${studentId}`}
        target="_blank"
      >
        {t("compliance.snapshot.printable")}
      </ButtonLink>
      <ButtonLink
        size="sm"
        variant="ghost"
        href={`/print/transcript/${studentId}`}
        target="_blank"
      >
        {t("compliance.snapshot.termRecord")}
      </ButtonLink>
      <ButtonLink
        size="sm"
        variant="ghost"
        href={`/api/transcript/${studentId}?format=csv`}
      >
        {t("compliance.snapshot.exportCsv")}
      </ButtonLink>
      <span className="text-xs text-ink-4">
        {lastSnapshotAt
          ? t("compliance.snapshot.last", {
              when: new Date(lastSnapshotAt).toLocaleString(intlLocale),
            })
          : t("compliance.snapshot.none")}
      </span>
    </div>
  );
}
