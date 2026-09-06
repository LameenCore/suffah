"use client";

import { useMemo, useState, useTransition } from "react";
import type { GraphNode } from "@/lib/db/skill-tree-queries";
import {
  addPrereqAction,
  removePrereqAction,
  setConceptTagAction,
} from "@/app/admin/skill-tree/actions";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export function SkillTreeEditor({ nodes }: { nodes: GraphNode[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const byCourse = useMemo(() => {
    const m = new Map<string, GraphNode[]>();
    for (const n of nodes) {
      const list = m.get(n.courseName) ?? [];
      list.push(n);
      m.set(n.courseName, list);
    }
    for (const list of m.values()) list.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    return m;
  }, [nodes]);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    start(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? "action failed");
    });
  }

  return (
    <div className="space-y-5">
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {[...byCourse.entries()].map(([courseName, courseNodes]) => (
        <Card key={courseName} as="section" className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">{courseName}</h2>
          <ul className="mt-3 divide-y divide-border">
            {courseNodes.map((node) => (
              <li key={node.id} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-ink">
                    {node.sequenceOrder}. {node.title}
                  </span>
                  <ConceptTag
                    nodeId={node.id}
                    value={node.conceptTag}
                    disabled={pending}
                    onSave={(tag) => run(() => setConceptTagAction(node.id, tag))}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-ink-4">Requires:</span>
                  {node.prereqs.length === 0 ? (
                    <span className="text-xs text-ink-4">nothing</span>
                  ) : (
                    node.prereqs.map((pid) => {
                      const p = byId.get(pid);
                      return (
                        <button
                          key={pid}
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => removePrereqAction(node.id, pid))}
                          className="inline-flex items-center gap-1 rounded-full bg-terracotta-soft px-2 py-0.5 text-xs text-terracotta-strong hover:brightness-95"
                          title="Remove"
                        >
                          {p ? `${p.courseName} · ${p.title}` : pid}
                          <span aria-hidden>×</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <AddPrereq
                  node={node}
                  all={nodes}
                  disabled={pending}
                  onAdd={(pid) => run(() => addPrereqAction(node.id, pid))}
                />
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}

function ConceptTag({
  nodeId,
  value,
  disabled,
  onSave,
}: {
  nodeId: string;
  value: string | null;
  disabled: boolean;
  onSave: (tag: string) => void;
}) {
  const [draft, setDraft] = useState(value ?? "");
  return (
    <span className="flex items-center gap-1.5">
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="concept tag"
        disabled={disabled}
        className="w-40 rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-xs"
        aria-label={`concept tag for node ${nodeId}`}
      />
      {draft !== (value ?? "") ? (
        <Button size="sm" variant="ghost" disabled={disabled} onClick={() => onSave(draft)}>
          Save
        </Button>
      ) : value ? (
        <Badge tone="teal">{value}</Badge>
      ) : null}
    </span>
  );
}

function AddPrereq({
  node,
  all,
  disabled,
  onAdd,
}: {
  node: GraphNode;
  all: GraphNode[];
  disabled: boolean;
  onAdd: (prereqNodeId: string) => void;
}) {
  const [sel, setSel] = useState("");
  const options = all.filter((n) => n.id !== node.id && !node.prereqs.includes(n.id));
  return (
    <div className="mt-2 flex items-center gap-2">
      <select
        value={sel}
        onChange={(e) => setSel(e.target.value)}
        disabled={disabled}
        className="rounded-[var(--radius)] border border-border bg-surface px-2 py-1 text-xs text-ink"
      >
        <option value="">add a prerequisite…</option>
        {options.map((n) => (
          <option key={n.id} value={n.id}>
            {n.courseName} · {n.sequenceOrder}. {n.title}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        variant="ghost"
        disabled={disabled || !sel}
        onClick={() => {
          onAdd(sel);
          setSel("");
        }}
      >
        Add
      </Button>
    </div>
  );
}
