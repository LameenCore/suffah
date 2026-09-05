"use client";

import { useTransition } from "react";
import { completeLessonAction } from "@/app/student/actions";

export function MarkCompleteButton({
  nodeId,
  completed,
}: {
  nodeId: string;
  completed: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (completed) {
    return (
      <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-200">
        <span className="font-semibold">Lesson complete.</span> The checkpoint for this
        node unlocks here next (Phase 2 · T07).
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => completeLessonAction(nodeId))}
      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
    >
      {pending ? "Saving…" : "Mark lesson complete"}
    </button>
  );
}
