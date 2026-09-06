"use client";

import { useTransition } from "react";
import { completeLessonAction } from "@/app/student/actions";
import { Button } from "@/components/ui/Button";
import { Crescent } from "@/components/ui/Motif";
import { useT } from "@/lib/i18n/client";

export function MarkCompleteButton({
  nodeId,
  completed,
}: {
  nodeId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const t = useT();

  if (completed) {
    return (
      <div className="flex items-center gap-2.5 rounded-[var(--radius)] border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
        <Crescent className="h-4 w-4" />
        <span>
          <span className="font-semibold">{t("student.lessonCompleteLead")}</span>{t("student.lessonCompleteRest")}
        </span>
      </div>
    );
  }

  return (
    <Button
      variant="accent"
      disabled={pending}
      onClick={() => startTransition(() => completeLessonAction(nodeId))}
    >
      {pending ? t("student.markCompleteSaving") : t("student.markComplete")}
    </Button>
  );
}
