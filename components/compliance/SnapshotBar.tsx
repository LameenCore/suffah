"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateSnapshotAction } from "@/app/admin/compliance/actions";
import { Button, ButtonLink } from "@/components/ui/Button";

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
        {pending ? "Saving snapshot..." : "Save snapshot to record"}
      </Button>
      <ButtonLink
        size="sm"
        variant="ghost"
        href={`/print/compliance/${studentId}`}
        target="_blank"
      >
        Open printable view
      </ButtonLink>
      <span className="text-xs text-ink-4">
        {lastSnapshotAt
          ? `Last snapshot: ${new Date(lastSnapshotAt).toLocaleString()}`
          : "No snapshot saved yet - the view above is live."}
      </span>
    </div>
  );
}
