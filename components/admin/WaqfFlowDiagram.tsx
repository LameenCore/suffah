// "What waqf is" in ~3 seconds (T24). The principal is a fixed, locked block
// that never changes; only its *returns* flow out to operations; sadaqah is a
// separate stream into the scholarship pool. Inline SVG, theme-aware via CSS
// vars, no chart library. The flow dashes animate unless the viewer asks for
// reduced motion. Server component - SMIL-free, pure CSS animation.

const money = (v: number) =>
  v.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

export function WaqfFlowDiagram({
  principal,
  returnsDisbursed,
  sadaqahReceived,
  scholarshipsAllocated,
}: {
  principal: number;
  returnsDisbursed: number;
  sadaqahReceived: number;
  scholarshipsAllocated: number;
}) {
  const scholarshipPool = Math.max(0, sadaqahReceived - scholarshipsAllocated);

  return (
    <div className="waqf-flow">
      <style>{`
        .waqf-flow {
          --wf-surface: #fcfcfb;
          --wf-ink: #0b0b0b;
          --wf-sub: #52514e;
          --wf-muted: #898781;
          --wf-lock-fill: #ece9e2;
          --wf-lock-stroke: #b7b1a3;
          --wf-flow: #2a78d6;
          --wf-sadaqah: #1baf7a;
          --wf-box: #f2f1ee;
        }
        @media (prefers-color-scheme: dark) {
          :root:not([data-theme="light"]) .waqf-flow {
            --wf-surface: #1a1a19; --wf-ink: #ffffff; --wf-sub: #c3c2b7; --wf-muted: #898781;
            --wf-lock-fill: #2a2a27; --wf-lock-stroke: #4a4741;
            --wf-flow: #3987e5; --wf-sadaqah: #199e70; --wf-box: #242320;
          }
        }
        :root[data-theme="dark"] .waqf-flow {
          --wf-surface: #1a1a19; --wf-ink: #ffffff; --wf-sub: #c3c2b7; --wf-muted: #898781;
          --wf-lock-fill: #2a2a27; --wf-lock-stroke: #4a4741;
          --wf-flow: #3987e5; --wf-sadaqah: #199e70; --wf-box: #242320;
        }
        .wf-stream {
          stroke-dasharray: 6 8;
          animation: wf-move 1.4s linear infinite;
        }
        .wf-stream--slow { animation-duration: 2.2s; }
        @keyframes wf-move { to { stroke-dashoffset: -14; } }
        @media (prefers-reduced-motion: reduce) {
          .wf-stream { animation: none; }
        }
      `}</style>

      <svg viewBox="0 0 720 240" role="img" className="w-full" style={{ height: "auto" }}
        aria-label={`The ${money(principal)} principal is locked and unchanged. ${money(
          returnsDisbursed,
        )} of its returns have been spent on operations. Sadaqah of ${money(
          sadaqahReceived,
        )} funds a scholarship pool.`}
      >
        {/* Principal - the locked block */}
        <rect x="24" y="46" width="236" height="150" rx="10"
          fill="var(--wf-lock-fill)" stroke="var(--wf-lock-stroke)" strokeWidth="2" />
        {/* padlock */}
        <g transform="translate(131 74)" fill="none" stroke="var(--wf-sub)" strokeWidth="2.5">
          <path d="M-9 4 v-6 a9 9 0 0 1 18 0 v6" />
          <rect x="-13" y="4" width="26" height="20" rx="3" fill="var(--wf-sub)" stroke="none" />
        </g>
        <text x="142" y="128" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--wf-ink)"
          style={{ fontVariantNumeric: "tabular-nums" }}>
          {money(principal)}
        </text>
        <text x="142" y="150" textAnchor="middle" fontSize="12" fill="var(--wf-sub)">
          Principal - locked
        </text>
        <text x="142" y="174" textAnchor="middle" fontSize="11" fill="var(--wf-muted)">
          unchanged since founding
        </text>

        {/* Returns outflow: from the block's top-right, thin, up to Operations */}
        <path id="wf-returns" d="M260 78 C 330 78, 360 44, 452 44"
          fill="none" stroke="var(--wf-flow)" strokeWidth="2.5" />
        <path d="M260 78 C 330 78, 360 44, 452 44" fill="none"
          stroke="var(--wf-flow)" strokeWidth="2.5" className="wf-stream" opacity="0.9" />
        <polygon points="452,39 462,44 452,49" fill="var(--wf-flow)" />
        <text x="356" y="34" textAnchor="middle" fontSize="10.5" fill="var(--wf-muted)">
          returns only - never principal
        </text>

        {/* Operations box */}
        <rect x="466" y="24" width="230" height="44" rx="8" fill="var(--wf-box)"
          stroke="var(--wf-lock-stroke)" strokeWidth="1" />
        <text x="481" y="42" fontSize="12" fill="var(--wf-sub)">Operations spent to date</text>
        <text x="481" y="59" fontSize="14" fontWeight="600" fill="var(--wf-ink)"
          style={{ fontVariantNumeric: "tabular-nums" }}>
          {money(returnsDisbursed)}
        </text>

        {/* Sadaqah stream - a separate system, does not touch the principal */}
        <text x="150" y="222" textAnchor="middle" fontSize="11" fill="var(--wf-muted)">
          Community sadaqah
        </text>
        <path d="M232 210 C 330 210, 360 186, 452 186" fill="none"
          stroke="var(--wf-sadaqah)" strokeWidth="2.5" />
        <path d="M232 210 C 330 210, 360 186, 452 186" fill="none"
          stroke="var(--wf-sadaqah)" strokeWidth="2.5" className="wf-stream wf-stream--slow" opacity="0.9" />
        <polygon points="452,181 462,186 452,191" fill="var(--wf-sadaqah)" />

        {/* Scholarship pool box */}
        <rect x="466" y="164" width="230" height="52" rx="8" fill="var(--wf-box)"
          stroke="var(--wf-lock-stroke)" strokeWidth="1" />
        <text x="481" y="182" fontSize="12" fill="var(--wf-sub)">Scholarship pool</text>
        <text x="481" y="200" fontSize="14" fontWeight="600" fill="var(--wf-ink)"
          style={{ fontVariantNumeric: "tabular-nums" }}>
          {money(scholarshipPool)}
        </text>
        <text x="481" y="212" fontSize="10" fill="var(--wf-muted)">
          {money(sadaqahReceived)} in · {money(scholarshipsAllocated)} awarded
        </text>
      </svg>

      <p className="mt-1 text-xs text-ink-3 ">
        The endowment principal is a fixed, locked block - it is never spent. Only the
        returns it earns flow out to operations, and sadaqah funds scholarships as a
        separate stream.
      </p>
    </div>
  );
}
