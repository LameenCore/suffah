import { Mascot } from "@/components/ui/Mascot";
import { Star8 } from "@/components/ui/Motif";

/**
 * Shown in place of the whole playground when a student has no active guardian
 * consent (Law 25 — T37). No dashboard chrome: there is nothing to navigate to.
 */
export function ConsentGate({ studentName }: { studentName: string }) {
  const firstName = studentName.split(" ")[0];
  return (
    <div className="relative flex min-h-full flex-col items-center justify-center px-6 py-16">
      <div
        className="geo-field pointer-events-none absolute inset-x-0 top-0 h-72 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
      <div className="relative w-full max-w-md space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center shadow-[var(--shadow-card)]">
        <Mascot size={72} mood="thinking" className="mx-auto" />
        <div className="flex items-center justify-center gap-2">
          <Star8 className="h-4 w-4 text-terracotta" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
            Suffa
          </span>
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">
          Almost ready, {firstName}
        </h1>
        <p className="text-sm text-ink-3">
          Your parent or guardian needs to complete a short consent step before your
          lessons open up. Once they do, everything here unlocks — no need to sign in
          again, just refresh.
        </p>
        <p className="text-xs text-ink-4">
          If you think this is a mistake, ask your masjid administrator.
        </p>
      </div>
    </div>
  );
}
