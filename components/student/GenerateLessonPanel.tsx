"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureLessonAction } from "@/app/student/actions";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";

export function GenerateLessonPanel({ nodeId }: { nodeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center shadow-[var(--shadow-card)]">
      <Mascot size={72} mood="thinking" className="mx-auto" />
      <p className="mt-3 font-display text-lg font-semibold text-ink">
        This lesson isn&apos;t ready yet
      </p>
      <p className="mt-1 text-sm text-ink-3">
        Fanoos will put it together for you - it only takes a moment.
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
                setError(e instanceof Error ? e.message : "generation failed");
              }
            })
          }
        >
          {pending ? "Preparing the lesson..." : "Prepare this lesson"}
        </Button>
      </div>
      {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
