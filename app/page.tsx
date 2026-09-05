import Link from "next/link";
import type { Metadata } from "next";
import { Star8, Crescent, Dome, Lantern, Flourish } from "@/components/ui/Motif";
import { Mascot } from "@/components/ui/Mascot";

export const metadata: Metadata = {
  title: {
    absolute: "Suffa — homeschool pods where the software carries the curriculum",
  },
  description:
    "Community-run homeschool pods for Quebec Muslim families. A self-paced curriculum playground keeps learning going even when a volunteer moves on; volunteers add live enrichment; the masjid handles admin and compliance. Waqf-sustained, free to families.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Suffa — homeschool pods that don't stop when a volunteer leaves",
    description:
      "A self-paced curriculum playground carries the teaching; community volunteers add live enrichment; the masjid handles compliance. Waqf-sustained, free to families.",
    type: "website",
    siteName: "Suffa",
  },
};

const STEPS = [
  {
    icon: <Lantern className="h-5 w-5 text-mustard" />,
    title: "The software carries the curriculum",
    body: "Lessons, checkpoints and assessments are delivered through a self-paced playground, one course at a time. A pod keeps moving through the material whether or not a volunteer is in the room this week.",
  },
  {
    icon: <Crescent className="h-5 w-5 text-teal-strong" />,
    title: "Volunteers add live enrichment",
    body: "Community volunteers run discussion, projects and socialisation — the part people are best at. When one moves on, the next gets a briefing of where the pod is and how it learns, not a blank slate.",
  },
  {
    icon: <Dome className="h-6 w-10 text-terracotta" />,
    title: "The masjid handles the rest",
    body: "Pod assignment (capped at four, matching Quebec's home-instruction threshold), volunteer onboarding, and a progress record assembled from real results for each family's filing.",
  },
];

const VIEWS = [
  {
    name: "Students",
    body: "A calm playground: pathways, lessons, and three tiers of assessment per course, at their own pace.",
  },
  {
    name: "Families",
    body: "A read-only view of how each child is doing, term evaluation status with no surprises, and pod schedule.",
  },
  {
    name: "Masjid admins",
    body: "Pods and volunteers, the compliance record, and a transparent waqf and donation ledger.",
  },
];

export default function Landing() {
  return (
    <div className="flex min-h-full flex-col bg-bg text-ink-2">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-5">
        <span className="flex items-center gap-2">
          <Star8 className="h-5 w-5 text-terracotta" />
          <span className="font-display text-lg font-semibold text-ink">Suffa</span>
        </span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/login" className="text-ink-3 hover:text-teal">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-teal px-4 py-2 font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
          >
            Family sign-up
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="geo-field pointer-events-none absolute inset-x-0 top-0 h-96 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
            aria-hidden
          />
          <div className="relative mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:py-24 md:grid-cols-[1.4fr_1fr] md:items-center">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                Community homeschool pods · Quebec
              </p>
              <h1 className="font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                Learning that doesn&apos;t stop when a volunteer moves on
              </h1>
              <p className="max-w-xl text-base text-ink-2">
                Suffa places children in small pods and lets a self-paced curriculum
                playground do the teaching, continuously. Community volunteers add live
                enrichment and socialisation. The masjid administers pods and assembles the
                compliance record. Sustained by a community endowment — free to families.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/signup"
                  className="rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
                >
                  Family sign-up
                </Link>
                <Link
                  href="/login"
                  className="rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-ink-2 transition-colors hover:border-teal hover:text-teal"
                >
                  Explore the demo
                </Link>
              </div>
              <p className="text-xs text-ink-4">
                The demo signs you in as a family, student, or masjid admin — no real data.
              </p>
            </div>
            <div className="hidden justify-self-center md:block">
              <Mascot size={190} mood="cheer" />
            </div>
          </div>
        </section>

        {/* The name */}
        <section className="border-y border-border bg-bg-tint">
          <div className="mx-auto w-full max-w-5xl px-6 py-12">
            <div className="flex items-start gap-3">
              <Flourish className="mt-1 h-4 w-16 shrink-0 text-terracotta" />
              <p className="max-w-3xl text-sm text-ink-2">
                <span className="font-medium text-ink">Ashab al-Suffa</span> — the
                &ldquo;People of the Platform&rdquo; — were companions who lived at the
                mosque in Medina and were sustained by the community so they could devote
                themselves fully to learning. Suffa&apos;s funding model mirrors that:
                a permanent waqf endowment, a small flat family fee, and sadaqah-funded
                scholarships — not tuition.
              </p>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-ink">
            Why pods usually break
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-2">
            Volunteer-run homeschool groups live and die by their volunteers. When one
            leaves — a move, a new job, a baby — the children they taught lose momentum,
            context, and often a whole subject. Suffa is built so the curriculum is the
            constant and the volunteer is the enrichment, not the other way round.
          </p>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-surface-2">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <h2 className="font-display text-2xl font-semibold text-ink">How Suffa works</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.title}
                  className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
                >
                  <div className="flex h-10 items-center">{s.icon}</div>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-ink-2">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Three views */}
        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-ink">One platform, three views</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {VIEWS.map((v) => (
              <div key={v.name} className="rounded-[var(--radius)] border border-border bg-surface p-5">
                <h3 className="font-display text-base font-semibold text-ink">{v.name}</h3>
                <p className="mt-1.5 text-sm text-ink-2">{v.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Join */}
        <section className="border-t border-border bg-bg-tint">
          <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-16 sm:grid-cols-2">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">For families</h2>
              <p className="mt-2 text-sm text-ink-2">
                Suffa runs through your masjid. Ask your masjid&apos;s education coordinator
                whether a pod is forming, or{" "}
                <Link href="/signup" className="text-teal underline underline-offset-2">
                  create a family account
                </Link>{" "}
                to see how it works. Your child&apos;s playground stays locked until you
                complete a short consent step.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">For masjids</h2>
              <p className="mt-2 text-sm text-ink-2">
                If your community wants to run pods on Suffa, reach out at{" "}
                <a
                  href="mailto:hello@suffa.community?subject=Running%20Suffa%20at%20our%20masjid"
                  className="text-teal underline underline-offset-2"
                >
                  hello@suffa.community
                </a>
                . You administer your own pods, volunteers, and compliance records.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 text-xs text-ink-4">
          <p className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-teal">Terms</Link>
            <Link href="/privacy" className="hover:text-teal">Privacy</Link>
            <Link href="/acceptable-use" className="hover:text-teal">Acceptable use</Link>
            <Link href="/login" className="ml-auto hover:text-teal">Sign in</Link>
          </p>
          <p className="mt-4 max-w-2xl">
            Exemption thresholds, evaluation formats, and compliance requirements shown
            anywhere in Suffa are illustrative and must be verified against current Quebec
            home-instruction regulation. Suffa organises evidence of learning; it does not
            file with the ministère de l&apos;Éducation on a family&apos;s behalf.
          </p>
          <p className="mt-4">Suffa — waqf-sustained community homeschooling.</p>
        </div>
      </footer>
    </div>
  );
}
