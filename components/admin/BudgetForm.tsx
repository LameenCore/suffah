"use client";

import { useState, useTransition } from "react";
import { setBudgetAction } from "@/app/admin/ai-spend/actions";
import { Button } from "@/components/ui/Button";

export function BudgetForm({
  monthlyLimitUsd,
  softAlertPercent,
  hardCapEnabled,
}: {
  monthlyLimitUsd: number;
  softAlertPercent: number;
  hardCapEnabled: boolean;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setMsg(null);
    start(async () => {
      const res = await setBudgetAction(fd);
      setMsg(
        res.ok
          ? { ok: true, text: "Saved." }
          : { ok: false, text: res.error ?? "Could not save." },
      );
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-ink-3">Monthly limit (USD)</span>
        <input
          name="monthlyLimitUsd"
          type="number"
          min="1"
          step="1"
          defaultValue={monthlyLimitUsd}
          className="w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2"
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-xs font-medium text-ink-3">Soft alert at (%)</span>
        <input
          name="softAlertPercent"
          type="number"
          min="1"
          max="100"
          step="1"
          defaultValue={softAlertPercent}
          className="w-full rounded-[var(--radius)] border border-border bg-surface px-3 py-2"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving..." : "Save budget"}
      </Button>
      <label className="flex items-center gap-2 text-sm text-ink-2 sm:col-span-3">
        <input name="hardCapEnabled" type="checkbox" defaultChecked={hardCapEnabled} />
        Hard cap: stop calling the model past the limit and serve cached content
      </label>
      {msg ? (
        <p
          className={`text-xs sm:col-span-3 ${msg.ok ? "text-teal-strong" : "text-danger"}`}
        >
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}
