import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEV_ROLE_COOKIE } from "@/lib/auth";
import type { Role } from "@/lib/types";

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

const DASHBOARDS: { role: Role; title: string; blurb: string; accent: string }[] = [
  {
    role: "student",
    title: "Student Playground",
    blurb: "AI-led lessons, checkpoints, and assessments — self-paced within the pod's unit.",
    accent: "hover:border-violet-500",
  },
  {
    role: "parent",
    title: "Parent Dashboard",
    blurb: "Read-only progress, checkpoint/assessment/exam results, pod schedule, fee status.",
    accent: "hover:border-sky-500",
  },
  {
    role: "admin",
    title: "Masjid Admin",
    blurb: "Volunteers, pod assignment, compliance reports, waqf/donation ledger, continuity handoff.",
    accent: "hover:border-emerald-500",
  },
];

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Suffa</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          AI-sustained, pod-based homeschooling for Quebec Muslim families. Pick a
          dashboard to enter the demo.
        </p>
        <Notice searchParams={searchParams} />
      </div>

      <div className="grid gap-4">
        {DASHBOARDS.map((d) => (
          <form key={d.role} action={enterAs}>
            <input type="hidden" name="role" value={d.role} />
            <button
              type="submit"
              className={`w-full rounded-xl border border-black/10 bg-white p-5 text-left transition-colors dark:border-white/15 dark:bg-zinc-950 ${d.accent}`}
            >
              <div className="font-medium">{d.title}</div>
              <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{d.blurb}</div>
            </button>
          </form>
        ))}
      </div>

      <p className="text-xs text-zinc-400">
        Demo auth only — a role cookie, not a real login.{" "}
        <Link href="/admin" className="underline underline-offset-2">
          Build order in TASKS.md
        </Link>
      </p>
    </div>
  );
}

async function Notice({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const sp = await searchParams;
  const denied = typeof sp.denied === "string" ? sp.denied : null;
  const next = typeof sp.next === "string" ? sp.next : null;
  if (!denied && !next) return null;
  return (
    <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
      {denied
        ? `That area needs the "${denied}" role. Pick it below to continue.`
        : `Sign in as "${next}" to continue.`}
    </p>
  );
}
