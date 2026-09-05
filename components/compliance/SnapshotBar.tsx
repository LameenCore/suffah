"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { generateSnapshotAction } from "@/app/admin/compliance/actions";

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
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-zinc-100 px-3 py-2 text-sm dark:bg-zinc-800/60">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await generateSnapshotAction(studentId, studentName);
            router.refresh();
          })
        }
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Saving snapshot…" : "Save snapshot to record"}
      </button>
      <Link
        href={`/admin/compliance/${studentId}/print`}
        target="_blank"
        className="rounded-md border border-black/15 px-3 py-1.5 text-xs text-zinc-600 hover:bg-white dark:border-white/20 dark:text-zinc-300 dark:hover:bg-zinc-950"
      >
        Open printable view
      </Link>
      <span className="text-xs text-zinc-500 dark:text-zinc-400">
        {lastSnapshotAt
          ? `Last snapshot: ${new Date(lastSnapshotAt).toLocaleString()}`
          : "No snapshot saved yet — the view above is live."}
      </span>
    </div>
  );
}
