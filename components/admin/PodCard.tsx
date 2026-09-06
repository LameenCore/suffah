"use client";

import { useState, useTransition } from "react";
import {
  assignStudentAction,
  setVolunteerAction,
  unassignStudentAction,
  type ActionResult,
} from "@/app/admin/pods/actions";
import type { AdminPod, AdminVolunteer, PodMember } from "@/lib/db/admin-queries";

const STATUS_LABEL: Record<AdminVolunteer["status"], string> = {
  active: "active",
  inactive: "inactive",
  pending_vetting: "pending vetting",
};

export function PodCard({
  pod,
  volunteers,
  unassignedStudents,
}: {
  pod: AdminPod;
  volunteers: AdminVolunteer[];
  unassignedStudents: PodMember[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [toAdd, setToAdd] = useState("");

  const full = pod.students.length >= pod.maxStudents;

  function dispatch(action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(res.error ?? "action failed");
    });
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4  ">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{pod.name}</h3>
        <span
          className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
            full
              ? "bg-warning-soft text-ink-2  "
              : "bg-surface-2 text-ink-3  "
          }`}
        >
          {pod.students.length} / {pod.maxStudents} students
        </span>
      </div>

      {/* Volunteer */}
      <label className="mt-3 block text-xs font-medium text-ink-3 ">
        <span className="block">Volunteer</span>
        <select
          className="mt-1 w-full rounded-md border border-border bg-surface px-2 py-1.5 text-sm  "
          value={pod.volunteer?.id ?? ""}
          disabled={pending}
          onChange={(e) =>
            dispatch(() => setVolunteerAction(pod.id, e.target.value || null))
          }
        >
          <option value="">(unassigned)</option>
          {volunteers.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name} ({STATUS_LABEL[v.status]})
            </option>
          ))}
        </select>
      </label>

      {/* Students */}
      <div className="mt-4 text-xs font-medium text-ink-3 ">
        Students
      </div>
      {pod.students.length === 0 ? (
        <p className="mt-1 text-sm text-ink-4">No students assigned.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {pod.students.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-md bg-surface-2 px-2 py-1 text-sm "
            >
              <span>{s.name}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  dispatch(() => unassignStudentAction(pod.id, s.id))
                }
                className="text-xs text-ink-4 underline underline-offset-2 hover:text-danger disabled:opacity-50"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Add a student */}
      <div className="mt-2 flex gap-2">
        <select
          className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1.5 text-sm disabled:opacity-50  "
          value={toAdd}
          disabled={pending || full || unassignedStudents.length === 0}
          onChange={(e) => setToAdd(e.target.value)}
        >
          <option value="">
            {full
              ? "pod is full"
              : unassignedStudents.length === 0
                ? "no unassigned students"
                : "add a student…"}
          </option>
          {unassignedStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={pending || !toAdd}
          onClick={() => {
            const id = toAdd;
            setToAdd("");
            dispatch(() => assignStudentAction(pod.id, id));
          }}
          className="rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-strong disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </section>
  );
}
