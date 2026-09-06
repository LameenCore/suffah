"use client";

import { useState, useTransition } from "react";
import type { AuthoringCourse, AuthoringNode } from "@/lib/db/authoring-queries";
import {
  createNodeAction,
  renameNodeAction,
  moveNodeAction,
  setNodeUnitAction,
  addUnitAction,
  deleteNodeAction,
  saveLessonJsonAction,
  saveCheckpointJsonAction,
  regenerateLessonAction,
  regenerateCheckpointAction,
  type ActionResult,
} from "@/app/admin/authoring/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type NodeContent = Record<string, { lesson: unknown; checkpoint: unknown }>;

const inputCls =
  "rounded-[var(--radius)] border border-border bg-surface px-2.5 py-1.5 text-sm text-ink";

export function CourseAuthoringEditor({
  course,
  content,
}: {
  course: AuthoringCourse;
  content: NodeContent;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>, okMsg?: string) {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "action failed");
      else if (okMsg) setNotice(okMsg);
    });
  }

  const unitTitle = (id: string | null) =>
    id ? (course.units.find((u) => u.id === id)?.title ?? "unknown unit") : "no unit";

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {notice ? <p className="text-sm text-success">{notice}</p> : null}

      <UnitPanel
        course={course}
        disabled={pending}
        onAdd={(title) => run(() => addUnitAction(course.id, title), "Unit added.")}
      />

      <AddNodePanel
        course={course}
        disabled={pending}
        onAdd={(title, unitId) =>
          run(() => createNodeAction(course.id, title, unitId), "Node added.")
        }
      />

      <Card as="section" className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Pathway nodes ({course.nodes.length})
        </h2>
        {course.nodes.length === 0 ? (
          <p className="mt-3 text-sm text-ink-4">No nodes yet. Add the first one above.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {course.nodes.map((node, i) => (
              <NodeRow
                key={node.id}
                node={node}
                index={i}
                total={course.nodes.length}
                course={course}
                unitTitle={unitTitle(node.unitId)}
                content={content[node.id]}
                disabled={pending}
                run={run}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function UnitPanel({
  course,
  disabled,
  onAdd,
}: {
  course: AuthoringCourse;
  disabled: boolean;
  onAdd: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <Card as="section" className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">
        Units ({course.units.length})
      </h2>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {course.units.map((u) => (
          <Badge key={u.id} tone="teal">
            {u.sequenceOrder}. {u.title}
          </Badge>
        ))}
        {course.units.length === 0 ? (
          <span className="text-xs text-ink-4">none yet</span>
        ) : null}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={`${inputCls} min-w-[16rem] flex-1`}
          placeholder="New unit title"
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="new unit title"
        />
        <Button
          size="sm"
          variant="ghost"
          disabled={disabled || !title.trim()}
          onClick={() => {
            onAdd(title.trim());
            setTitle("");
          }}
        >
          Add unit
        </Button>
      </div>
    </Card>
  );
}

function AddNodePanel({
  course,
  disabled,
  onAdd,
}: {
  course: AuthoringCourse;
  disabled: boolean;
  onAdd: (title: string, unitId: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState("");
  return (
    <Card as="section" className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Add a node</h2>
      <p className="mt-1 text-xs text-ink-4">
        New nodes are added at the end of the pathway. Generate the lesson and
        checkpoint below once it exists.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={`${inputCls} min-w-[16rem] flex-1`}
          placeholder="Node title, e.g. “Multiplying integers”"
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="new node title"
        />
        <select
          className={inputCls}
          value={unitId}
          disabled={disabled}
          onChange={(e) => setUnitId(e.target.value)}
          aria-label="unit for the new node"
        >
          <option value="">no unit</option>
          {course.units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.title}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          disabled={disabled || !title.trim()}
          onClick={() => {
            onAdd(title.trim(), unitId || null);
            setTitle("");
          }}
        >
          Add node
        </Button>
      </div>
    </Card>
  );
}

function NodeRow({
  node,
  index,
  total,
  course,
  unitTitle,
  content,
  disabled,
  run,
}: {
  node: AuthoringNode;
  index: number;
  total: number;
  course: AuthoringCourse;
  unitTitle: string;
  content: { lesson: unknown; checkpoint: unknown } | undefined;
  disabled: boolean;
  run: (fn: () => Promise<ActionResult>, okMsg?: string) => void;
}) {
  const [title, setTitle] = useState(node.title);
  const [open, setOpen] = useState(false);

  const deleteBlockedReason =
    node.podsOnNode > 0
      ? `${node.podsOnNode} pod(s) are on this node`
      : node.hasStudentActivity
        ? "students have results/progress here"
        : null;

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-6 shrink-0 text-sm tabular-nums text-ink-4">{node.sequenceOrder}.</span>
        <input
          className={`${inputCls} min-w-[14rem] flex-1`}
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={`title for node ${node.sequenceOrder}`}
        />
        {title.trim() !== node.title && title.trim() ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => run(() => renameNodeAction(course.id, node.id, title.trim()), "Renamed.")}
          >
            Save title
          </Button>
        ) : null}

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || index === 0}
            onClick={() => run(() => moveNodeAction(course.id, node.id, "up"), "Reordered.")}
            aria-label={`move node ${node.sequenceOrder} up`}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || index === total - 1}
            onClick={() => run(() => moveNodeAction(course.id, node.id, "down"), "Reordered.")}
            aria-label={`move node ${node.sequenceOrder} down`}
          >
            ↓
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-8">
        <label className="text-xs text-ink-4">
          Unit:{" "}
          <select
            className={`${inputCls} py-1 text-xs`}
            value={node.unitId ?? ""}
            disabled={disabled}
            onChange={(e) =>
              run(
                () => setNodeUnitAction(course.id, node.id, e.target.value || null),
                "Unit updated.",
              )
            }
            aria-label={`unit for node ${node.sequenceOrder}`}
          >
            <option value="">no unit</option>
            {course.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </label>
        <Badge tone={node.hasLesson ? "success" : "mustard"}>
          {node.hasLesson ? "lesson ✓" : "no lesson"}
        </Badge>
        <Badge tone={node.hasCheckpoint ? "success" : "mustard"}>
          {node.hasCheckpoint ? "checkpoint ✓" : "no checkpoint"}
        </Badge>
        {node.podsOnNode > 0 ? (
          <Badge tone="teal">{node.podsOnNode} pod(s) here</Badge>
        ) : null}

        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => setOpen((v) => !v)}>
          {open ? "Hide content" : "Edit content"}
        </Button>

        {deleteBlockedReason ? (
          <span className="text-xs text-ink-4" title={deleteBlockedReason}>
            🔒 can&apos;t delete — {deleteBlockedReason}
          </span>
        ) : (
          <Button
            size="sm"
            variant="danger"
            disabled={disabled}
            onClick={() => {
              if (
                window.confirm(
                  `Delete “${node.title}”? Remaining nodes are renumbered. This cannot be undone.`,
                )
              ) {
                run(() => deleteNodeAction(course.id, node.id), "Node deleted.");
              }
            }}
          >
            Delete
          </Button>
        )}
      </div>
      <p className="mt-1 pl-8 text-xs text-ink-4">In {unitTitle}</p>

      {open ? (
        <div className="mt-3 space-y-4 pl-8">
          <ContentEditor
            kind="lesson"
            value={content?.lesson ?? null}
            disabled={disabled}
            onRegenerate={() =>
              run(
                () => regenerateLessonAction(course.id, node.id),
                "Lesson regenerated (force).",
              )
            }
            onSave={(json) =>
              run(() => saveLessonJsonAction(course.id, node.id, json), "Lesson saved.")
            }
          />
          <ContentEditor
            kind="checkpoint"
            value={content?.checkpoint ?? null}
            disabled={disabled || !node.hasLesson}
            disabledHint={!node.hasLesson ? "Generate the lesson first." : undefined}
            onRegenerate={() =>
              run(
                () => regenerateCheckpointAction(course.id, node.id),
                "Checkpoint regenerated (force).",
              )
            }
            onSave={(json) =>
              run(() => saveCheckpointJsonAction(course.id, node.id, json), "Checkpoint saved.")
            }
          />
        </div>
      ) : null}
    </li>
  );
}

function ContentEditor({
  kind,
  value,
  disabled,
  disabledHint,
  onRegenerate,
  onSave,
}: {
  kind: "lesson" | "checkpoint";
  value: unknown;
  disabled: boolean;
  disabledHint?: string;
  onRegenerate: () => void;
  onSave: (json: string) => void;
}) {
  const initial = value ? JSON.stringify(value, null, 2) : "";
  const [draft, setDraft] = useState(initial);
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold capitalize text-ink">{kind} content</h3>
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() => {
              setDraft(initial);
              setEditing((v) => !v);
            }}
          >
            {editing ? "Cancel" : value ? "Hand-edit JSON" : "Add JSON"}
          </Button>
          <Button size="sm" variant="ghost" disabled={disabled} onClick={onRegenerate}>
            {value ? "Regenerate" : "Generate"}
          </Button>
        </div>
      </div>
      {disabledHint ? <p className="mt-1 text-xs text-ink-4">{disabledHint}</p> : null}

      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea
            className="h-64 w-full rounded-[var(--radius)] border border-border bg-surface p-2 font-mono text-xs text-ink"
            value={draft}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            aria-label={`${kind} JSON`}
          />
          <p className="text-xs text-ink-4">
            Validated against the {kind} schema before it is saved. Saving stamps a
            fresh version marker; the node id is unchanged so pods stay in place.
          </p>
          <Button
            size="sm"
            disabled={disabled || !draft.trim()}
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
          >
            Validate & save {kind}
          </Button>
        </div>
      ) : value ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded-[var(--radius)] bg-surface p-2 font-mono text-[11px] leading-relaxed text-ink-3">
          {initial}
        </pre>
      ) : (
        <p className="mt-2 text-xs text-ink-4">Not generated yet.</p>
      )}
    </div>
  );
}
