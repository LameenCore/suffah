"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureLessonAction } from "@/app/student/actions";

export function GenerateLessonPanel({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-6 text-center dark:border-white/15 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This lesson hasn&apos;t been prepared yet.
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            try {
              await ensureLessonAction(nodeId);
              router.refresh();
            } catch (e) {
              setError(e instanceof Error ? e.message : "generation failed");
            }
          })
        }
        className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-60"
      >
        {pending ? "Preparing lesson…" : "Start this lesson"}
      </button>
      {error ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p> : null}
    </div>
  );
}
