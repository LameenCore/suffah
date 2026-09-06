"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureLessonAction } from "@/app/student/actions";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";
import { useT } from "@/lib/i18n/client";

export function GenerateLessonPanel({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
      <Mascot size={72} mood="thinking" className="mx-auto" />
      <p className="mt-3 font-display text-lg font-semibold text-ink">
        {t("student.generatePanel.title")}
      </p>
      <p className="mt-1 text-sm text-ink-3">
        {t("student.generatePanel.body")}
      </p>
      <div className="mt-4">
        <Button
          variant="accent"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              try {
                await ensureLessonAction(nodeId);
                router.refresh();
              } catch (e) {
                setError(e instanceof Error ? e.message : t("student.generatePanel.failed"));
              }
            })
          }
        >
          {pending ? t("student.generatePanel.working") : t("student.generatePanel.cta")}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
