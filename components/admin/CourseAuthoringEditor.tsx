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
import { useT } from "@/lib/i18n/client";
import type { Translator } from "@/lib/i18n";

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
  const t = useT();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function run(fn: () => Promise<ActionResult>, okMsg?: string) {
    setError(null);
    setNotice(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? t("admin.authoring.actionFailed"));
      else if (okMsg) setNotice(okMsg);
    });
  }

  const unitTitle = (id: string | null) =>
    id
      ? course.units.find((u) => u.id === id)?.title ?? t("admin.authoring.unknownUnit")
      : t("admin.authoring.noUnit");

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {notice ? <p className="text-sm text-success">{notice}</p> : null}

      <UnitPanel
        t={t}
        course={course}
        disabled={pending}
        onAdd={(title) =>
          run(() => addUnitAction(course.id, title), t("admin.authoring.unitAdded"))
        }
      />

      <AddNodePanel
        t={t}
        course={course}
        disabled={pending}
        onAdd={(title, unitId) =>
          run(
            () => createNodeAction(course.id, title, unitId),
            t("admin.authoring.nodeAdded"),
          )
        }
      />

      <Card as="section" className="p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          {t("admin.authoring.pathwayNodesHeading", { n: course.nodes.length })}
        </h2>
        {course.nodes.length === 0 ? (
          <p className="mt-3 text-sm text-ink-4">{t("admin.authoring.noNodesYet")}</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {course.nodes.map((node, i) => (
              <NodeRow
                key={node.id}
                t={t}
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
  t,
  course,
  disabled,
  onAdd,
}: {
  t: Translator;
  course: AuthoringCourse;
  disabled: boolean;
  onAdd: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <Card as="section" className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">
        {t("admin.authoring.unitsHeading", { n: course.units.length })}
      </h2>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {course.units.map((u) => (
          <Badge key={u.id} tone="teal">
            {u.sequenceOrder}. {u.title}
          </Badge>
        ))}
        {course.units.length === 0 ? (
          <span className="text-xs text-ink-4">{t("admin.authoring.noneYet")}</span>
        ) : null}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={`${inputCls} min-w-[16rem] flex-1`}
          placeholder={t("admin.authoring.newUnitTitle")}
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t("admin.authoring.newUnitAria")}
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
          {t("admin.authoring.addUnit")}
        </Button>
      </div>
    </Card>
  );
}

function AddNodePanel({
  t,
  course,
  disabled,
  onAdd,
}: {
  t: Translator;
  course: AuthoringCourse;
  disabled: boolean;
  onAdd: (title: string, unitId: string | null) => void;
}) {
  const [title, setTitle] = useState("");
  const [unitId, setUnitId] = useState("");
  return (
    <Card as="section" className="p-5">
      <h2 className="font-display text-lg font-semibold text-ink">
        {t("admin.authoring.addNodeHeading")}
      </h2>
      <p className="mt-1 text-xs text-ink-4">{t("admin.authoring.addNodeLede")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          className={`${inputCls} min-w-[16rem] flex-1`}
          placeholder={t("admin.authoring.nodeTitlePlaceholder")}
          value={title}
          disabled={disabled}
          onChange={(e) => setTitle(e.target.value)}
          aria-label={t("admin.authoring.newNodeAria")}
        />
        <select
          className={inputCls}
          value={unitId}
          disabled={disabled}
          onChange={(e) => setUnitId(e.target.value)}
          aria-label={t("admin.authoring.unitForNewNodeAria")}
        >
          <option value="">{t("admin.authoring.noUnit")}</option>
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
          {t("admin.authoring.addNode")}
        </Button>
      </div>
    </Card>
  );
}

function NodeRow({
  t,
  node,
  index,
  total,
  course,
  unitTitle,
  content,
  disabled,
  run,
}: {
  t: Translator;
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
      ? t("admin.authoring.podsOnNode", { n: node.podsOnNode })
      : node.hasStudentActivity
        ? t("admin.authoring.studentActivityHere")
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
          aria-label={t("admin.authoring.titleForNodeAria", { n: node.sequenceOrder })}
        />
        {title.trim() !== node.title && title.trim() ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled}
            onClick={() =>
              run(
                () => renameNodeAction(course.id, node.id, title.trim()),
                t("admin.authoring.renamed"),
              )
            }
          >
            {t("admin.authoring.saveTitle")}
          </Button>
        ) : null}

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || index === 0}
            onClick={() =>
              run(
                () => moveNodeAction(course.id, node.id, "up"),
                t("admin.authoring.reordered"),
              )
            }
            aria-label={t("admin.authoring.moveUpAria", { n: node.sequenceOrder })}
          >
            ↑
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={disabled || index === total - 1}
            onClick={() =>
              run(
                () => moveNodeAction(course.id, node.id, "down"),
                t("admin.authoring.reordered"),
              )
            }
            aria-label={t("admin.authoring.moveDownAria", { n: node.sequenceOrder })}
          >
            ↓
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 pl-8">
        <label className="text-xs text-ink-4">
          {t("admin.authoring.unitLabel")}
          <select
            className={`${inputCls} py-1 text-xs`}
            value={node.unitId ?? ""}
            disabled={disabled}
            onChange={(e) =>
              run(
                () => setNodeUnitAction(course.id, node.id, e.target.value || null),
                t("admin.authoring.unitUpdated"),
              )
            }
            aria-label={t("admin.authoring.unitForNodeAria", { n: node.sequenceOrder })}
          >
            <option value="">{t("admin.authoring.noUnit")}</option>
            {course.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.title}
              </option>
            ))}
          </select>
        </label>
        <Badge tone={node.hasLesson ? "success" : "mustard"}>
          {node.hasLesson
            ? t("admin.authoring.lessonYes")
            : t("admin.authoring.lessonNo")}
        </Badge>
        <Badge tone={node.hasCheckpoint ? "success" : "mustard"}>
          {node.hasCheckpoint
            ? t("admin.authoring.checkpointYes")
            : t("admin.authoring.checkpointNo")}
        </Badge>
        {node.podsOnNode > 0 ? (
          <Badge tone="teal">
            {t("admin.authoring.podsHere", { n: node.podsOnNode })}
          </Badge>
        ) : null}

        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => setOpen((v) => !v)}>
          {open ? t("admin.authoring.hideContent") : t("admin.authoring.editContent")}
        </Button>

        {deleteBlockedReason ? (
          <span className="text-xs text-ink-4" title={deleteBlockedReason}>
            {t("admin.authoring.cantDelete", { reason: deleteBlockedReason })}
          </span>
        ) : (
          <Button
            size="sm"
            variant="danger"
            disabled={disabled}
            onClick={() => {
              if (
                window.confirm(
                  t("admin.authoring.deleteConfirm", { title: node.title }),
                )
              ) {
                run(
                  () => deleteNodeAction(course.id, node.id),
                  t("admin.authoring.nodeDeleted"),
                );
              }
            }}
          >
            {t("admin.authoring.delete")}
          </Button>
        )}
      </div>
      <p className="mt-1 pl-8 text-xs text-ink-4">
        {t("admin.authoring.inUnit", { unit: unitTitle })}
      </p>

      {open ? (
        <div className="mt-3 space-y-4 pl-8">
          <ContentEditor
            t={t}
            kind="lesson"
            value={content?.lesson ?? null}
            disabled={disabled}
            onRegenerate={() =>
              run(
                () => regenerateLessonAction(course.id, node.id),
                t("admin.authoring.lessonRegenerated"),
              )
            }
            onSave={(json) =>
              run(
                () => saveLessonJsonAction(course.id, node.id, json),
                t("admin.authoring.lessonSaved"),
              )
            }
          />
          <ContentEditor
            t={t}
            kind="checkpoint"
            value={content?.checkpoint ?? null}
            disabled={disabled || !node.hasLesson}
            disabledHint={
              !node.hasLesson ? t("admin.authoring.generateLessonFirst") : undefined
            }
            onRegenerate={() =>
              run(
                () => regenerateCheckpointAction(course.id, node.id),
                t("admin.authoring.checkpointRegenerated"),
              )
            }
            onSave={(json) =>
              run(
                () => saveCheckpointJsonAction(course.id, node.id, json),
                t("admin.authoring.checkpointSaved"),
              )
            }
          />
        </div>
      ) : null}
    </li>
  );
}

function ContentEditor({
  t,
  kind,
  value,
  disabled,
  disabledHint,
  onRegenerate,
  onSave,
}: {
  t: Translator;
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

  const heading =
    kind === "lesson"
      ? t("admin.authoring.lessonContentHeading")
      : t("admin.authoring.checkpointContentHeading");
  const jsonAria =
    kind === "lesson"
      ? t("admin.authoring.lessonJsonAria")
      : t("admin.authoring.checkpointJsonAria");
  const validatedNote =
    kind === "lesson"
      ? t("admin.authoring.lessonValidatedNote")
      : t("admin.authoring.checkpointValidatedNote");
  const validateSave =
    kind === "lesson"
      ? t("admin.authoring.validateSaveLesson")
      : t("admin.authoring.validateSaveCheckpoint");

  return (
    <div className="rounded-[var(--radius)] border border-border bg-surface-2 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink">{heading}</h3>
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
            {editing
              ? t("admin.authoring.cancel")
              : value
                ? t("admin.authoring.handEditJson")
                : t("admin.authoring.addJson")}
          </Button>
          <Button size="sm" variant="ghost" disabled={disabled} onClick={onRegenerate}>
            {value ? t("admin.authoring.regenerate") : t("admin.authoring.generate")}
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
            aria-label={jsonAria}
          />
          <p className="text-xs text-ink-4">{validatedNote}</p>
          <Button
            size="sm"
            disabled={disabled || !draft.trim()}
            onClick={() => {
              onSave(draft);
              setEditing(false);
            }}
          >
            {validateSave}
          </Button>
        </div>
      ) : value ? (
        <pre className="mt-2 max-h-48 overflow-auto rounded-[var(--radius)] bg-surface p-2 font-mono text-[11px] leading-relaxed text-ink-3">
          {initial}
        </pre>
      ) : (
        <p className="mt-2 text-xs text-ink-4">{t("admin.authoring.notGeneratedYet")}</p>
      )}
    </div>
  );
}
