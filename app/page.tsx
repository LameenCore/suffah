import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_ROLE_COOKIE } from "@/lib/auth";
import type { Role } from "@/lib/types";
import { Star8, Crescent, BookMark, Dome } from "@/components/ui/Motif";
import { Mascot } from "@/components/ui/Mascot";

// Landing / dev role picker. Real builds replace this with a login screen;
// for the hackathon demo it just drops a role cookie and enters the dashboard.

async function enterAs(formData: FormData) {
  "use server";
  const role = String(formData.get("role")) as Role;
  const dest = { admin: "/admin", parent: "/parent", student: "/student" }[role];
  if (!dest) redirect("/");
  (await cookies()).set(DEV_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  redirect(dest);
}

const DASHBOARDS: {
  role: Role;
  title: string;
  blurb: string;
  icon: React.ReactNode;
  tone: string;
}[] = [
  {
    role: "student",
    title: "Student Playground",
    blurb: "AI-led lessons, friendly checkpoints, and a self-paced path through each course.",
    icon: <BookMark className="h-6 w-6" />,
    tone: "group-hover:border-mustard",
  },
  {
    role: "parent",
    title: "Family Dashboard",
    blurb: "See your child's week at a glance, the pod schedule, and where they stand for the term.",
    icon: <Crescent className="h-6 w-6" />,
    tone: "group-hover:border-coral",
  },
  {
    role: "admin",
    title: "Masjid Admin",
    blurb: "Pods and volunteers, the continuity handoff, compliance records, and the waqf ledger.",
    icon: <Dome className="h-6 w-6" />,
    tone: "group-hover:border-teal",
  },
];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="relative flex min-h-full flex-col">
      <div
        className="geo-field pointer-events-none absolute inset-x-0 top-0 h-72 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-6 py-16">
        <div className="flex items-start gap-5">
          <Mascot size={84} mood="cheer" className="shrink-0" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Star8 className="h-5 w-5 text-terracotta" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                People of the Platform
              </span>
            </div>
            <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">Suffa</h1>
            <p className="max-w-xl text-ink-2">
              An AI-sustained, pod-based homeschool for Quebec Muslim families. The community
              carries the learner &mdash; so learning never stops, even when a volunteer moves on.
            </p>
            <Notice searchParams={searchParams} />
          </div>
        </div>

        <div className="grid gap-3">
          {DASHBOARDS.map((d) => (
            <form key={d.role} action={enterAs}>
              <input type="hidden" name="role" value={d.role} />
              <button
                type="submit"
                className={`group flex w-full items-center gap-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-pop)] ${d.tone}`}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-terracotta">
                  {d.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold text-ink">
                    {d.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-3">{d.blurb}</span>
                </span>
                <span className="ml-auto shrink-0 text-ink-4 transition-transform group-hover:translate-x-0.5">
                  &rarr;
                </span>
              </button>
            </form>
          ))}
        </div>

        <p className="text-xs text-ink-4">
          Demo sign-in only &mdash; a role cookie, not a real login.{" "}
          <Link href="/admin" className="underline underline-offset-2 hover:text-teal">
            Build notes in TASKS.md
          </Link>
        </p>
      </div>
    </div>
  );
}

async function Notice({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const sp = await searchParams;
  const denied = typeof sp.denied === "string" ? sp.denied : null;
  const next = typeof sp.next === "string" ? sp.next : null;
  if (!denied && !next) return null;
  return (
    <p className="rounded-[var(--radius)] border border-mustard/40 bg-mustard-soft px-3 py-2 text-sm text-[color:var(--ink)]">
      {denied
        ? `That area needs the "${denied}" role. Pick it below to continue.`
        : `Sign in as "${next}" to continue.`}
    </p>
  );
}
