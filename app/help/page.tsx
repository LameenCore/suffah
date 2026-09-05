import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listOwnSupportRequests } from "@/lib/db/support-queries";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Star8 } from "@/components/ui/Motif";
import { HelpForm } from "@/components/HelpForm";

const HOME: Record<string, string> = {
  admin: "/admin",
  parent: "/parent",
  student: "/student",
};

const CAT_TONE = {
  question: "teal",
  bug: "danger",
  idea: "mustard",
  "data-erasure": "warning",
} as const;

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  let own: Awaited<ReturnType<typeof listOwnSupportRequests>> = [];
  try {
    own = await listOwnSupportRequests(user.id, user.masjidId);
  } catch {
    own = [];
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2">
            <Star8 className="h-6 w-6 text-terracotta" />
            <span className="font-display text-lg font-semibold text-ink">Suffa</span>
          </Link>
          <Link
            href={HOME[user.role] ?? "/"}
            className="rounded-full border border-border px-3 py-1 text-xs text-ink-3 hover:border-teal hover:text-teal"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-8 px-5 py-10">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-terracotta">
            Get help
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Ask a question or report a bug
          </h1>
          <p className="text-sm text-ink-3">
            This goes straight to the masjid admin, who sees it in their inbox. You&apos;ll
            find their reply here once they&apos;ve looked at it.
          </p>
        </div>

        <Card className="p-5">
          <HelpForm />
        </Card>

        {own.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-3">
              Your recent messages
            </h2>
            {own.map((r) => (
              <Card key={r.id} as="section" className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={CAT_TONE[r.category]}>{r.category}</Badge>
                  <Badge tone={r.status === "open" ? "warning" : "success"}>
                    {r.status === "open" ? "Open" : "Resolved"}
                  </Badge>
                  <span className="text-xs text-ink-4">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-2 font-medium text-ink">{r.subject}</p>
                <p className="mt-1 text-sm text-ink-2">{r.body}</p>
                {r.adminNote ? (
                  <p className="mt-2 rounded-[var(--radius)] bg-teal-soft px-3 py-2 text-sm text-teal-strong">
                    <span className="font-semibold">Masjid reply:</span> {r.adminNote}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}
