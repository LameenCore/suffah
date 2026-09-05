import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getReviewDeck, getRetentionSignal } from "@/lib/review";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ReviewDeck } from "@/components/student/ReviewDeck";

export default async function ReviewPage() {
  const user = await requireRole("student");

  let cards: Awaited<ReturnType<typeof getReviewDeck>> = [];
  let signal: Awaited<ReturnType<typeof getRetentionSignal>> | null = null;
  let loadError: string | null = null;
  try {
    cards = await getReviewDeck(user.id, user.masjidId, 8);
    signal = await getRetentionSignal(user.id, user.masjidId);
  } catch (err) {
    loadError = err instanceof Error ? err.message : "could not load your review";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Review"
        title="Keep it fresh"
        lede="Short spaced reviews of things you've already learned. A minute or two."
        back={{ href: "/student", label: "My courses" }}
      />

      {loadError ? (
        <Card tone="warning" className="p-4 text-sm text-ink-2">
          {loadError}. Run <code>npm run migrate</code>.
        </Card>
      ) : cards.length === 0 ? (
        <Card className="p-6 text-sm text-ink-2">
          <p className="font-medium text-ink">Nothing due right now.</p>
          <p className="mt-1 text-ink-3">
            {signal && signal.totalItems > 0
              ? `${signal.totalItems} item${signal.totalItems === 1 ? "" : "s"} in your deck. The next few are scheduled for later.`
              : "Pass a checkpoint and its questions start showing up here for review."}
          </p>
          <Link
            href="/student"
            className="mt-3 inline-block text-sm font-medium text-terracotta hover:text-terracotta-strong"
          >
            Back to your courses &rarr;
          </Link>
        </Card>
      ) : (
        <ReviewDeck cards={cards} />
      )}
    </div>
  );
}
