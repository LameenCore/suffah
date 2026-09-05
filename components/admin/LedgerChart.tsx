"use client";

// Cumulative operating spend over time, on a single y-axis that runs 0 → the
// locked principal. The story the chart tells: spending (from returns + sadaqah)
// barely lifts off the floor — the principal is never touched. One series, one
// axis, a dashed reference line for the principal. Inline SVG, no chart library.
//
// Palette + mark specs from the dataviz skill (series-1 blue; thin marks; hover
// layer by default; table view lives on the page).

import { useId, useRef, useState } from "react";
import type { SpendPoint } from "@/lib/db/ledger-queries";

const W = 720;
const H = 260;
const PAD = { top: 18, right: 18, bottom: 28, left: 60 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

const money = (v: number) =>
  v.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
const kAxis = (v: number) => (v === 0 ? "$0" : `$${Math.round(v / 1000)}k`);
const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-CA", { month: "short", year: "2-digit" });

export function LedgerChart({
  series,
  principal,
}: {
  series: SpendPoint[];
  principal: number;
}) {
  const gradId = useId();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (series.length < 2 || principal <= 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Not enough ledger data to chart yet.
      </p>
    );
  }

  const t0 = new Date(series[0].t).getTime();
  const t1 = new Date(series[series.length - 1].t).getTime();
  const span = Math.max(1, t1 - t0);

  const x = (iso: string) => PAD.left + (PLOT_W * (new Date(iso).getTime() - t0)) / span;
  const y = (v: number) => PAD.top + PLOT_H * (1 - v / principal);

  const pts = series.map((p) => ({ ...p, px: x(p.t), py: y(p.cumulativeOut) }));
  const baseline = y(0);

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.px},${p.py}`).join(" ");
  const areaPath =
    `M${pts[0].px},${baseline} ` +
    pts.map((p) => `L${p.px},${p.py}`).join(" ") +
    ` L${pts[pts.length - 1].px},${baseline} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * principal);
  const last = pts[pts.length - 1];
  const hover = hoverIdx == null ? null : pts[hoverIdx];

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestD = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.px - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    setHoverIdx(best);
  }

  return (
    <div className="viz-root relative">
      <style>{`
        .viz-root {
          --surface-1: #fcfcfb;
          --text-secondary: #52514e;
          --muted: #898781;
          --grid: #e1e0d9;
          --baseline: #c3c2b7;
          --series-1: #2a78d6;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .viz-root {
            --surface-1: #1a1a19;
            --text-secondary: #c3c2b7;
            --muted: #898781;
            --grid: #2c2c2a;
            --baseline: #383835;
            --series-1: #3987e5;
          }
        }
        :root[data-theme="dark"] .viz-root {
          --surface-1: #1a1a19;
          --text-secondary: #c3c2b7;
          --muted: #898781;
          --grid: #2c2c2a;
          --baseline: #383835;
          --series-1: #3987e5;
        }
      `}</style>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Cumulative operating spend reached ${money(
          last.cumulativeOut,
        )} against a locked principal of ${money(principal)}.`}
        className="w-full"
        style={{ height: "auto" }}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--series-1)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--series-1)" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* y grid + ticks */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(v) + 3}
              textAnchor="end"
              fontSize={11}
              fill="var(--muted)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {kAxis(v)}
            </text>
          </g>
        ))}

        {/* principal reference line */}
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={y(principal)}
          y2={y(principal)}
          stroke="var(--baseline)"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        <text
          x={W - PAD.right}
          y={y(principal) + 13}
          textAnchor="end"
          fontSize={11}
          fill="var(--text-secondary)"
        >
          Principal {money(principal)} — untouched
        </text>

        {/* area + line */}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path
          d={linePath}
          fill="none"
          stroke="var(--series-1)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* last-point marker + direct label */}
        <circle cx={last.px} cy={last.py} r={3.5} fill="var(--series-1)" />
        <text
          x={last.px - 6}
          y={last.py - 8}
          textAnchor="end"
          fontSize={11}
          fill="var(--text-secondary)"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {money(last.cumulativeOut)} spent
        </text>

        {/* x labels: first + last */}
        <text x={pts[0].px} y={H - 8} textAnchor="start" fontSize={11} fill="var(--muted)">
          {monthLabel(series[0].t)}
        </text>
        <text x={last.px} y={H - 8} textAnchor="end" fontSize={11} fill="var(--muted)">
          {monthLabel(series[series.length - 1].t)}
        </text>

        {/* hover crosshair */}
        {hover && (
          <g>
            <line
              x1={hover.px}
              x2={hover.px}
              y1={PAD.top}
              y2={baseline}
              stroke="var(--baseline)"
              strokeWidth={1}
            />
            <circle
              cx={hover.px}
              cy={hover.py}
              r={4.5}
              fill="var(--series-1)"
              stroke="var(--surface-1)"
              strokeWidth={2}
            />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 rounded-md border border-black/10 bg-white px-2 py-1 text-xs shadow-sm dark:border-white/15 dark:bg-zinc-900"
          style={{ left: `${(hover.px / W) * 100}%`, top: 0 }}
        >
          <div className="font-medium tabular-nums">{money(hover.cumulativeOut)}</div>
          <div className="text-zinc-500 dark:text-zinc-400">
            by {new Date(hover.t).toLocaleDateString("en-CA", { month: "long", year: "numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}
