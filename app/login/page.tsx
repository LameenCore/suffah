import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signInAction, demoAsAction } from "@/app/login/actions";
import { Star8 } from "@/components/ui/Motif";
import { Mascot } from "@/components/ui/Mascot";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const user = await getCurrentUser();
  if (user) redirect(`/${user.role}`);

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const next = typeof sp.next === "string" ? sp.next : "";

  return (
    <div className="relative flex min-h-full flex-col">
      <div
        className="geo-field pointer-events-none absolute inset-x-0 top-0 h-72 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-6 py-16">
        <div className="flex items-center gap-3">
          <Mascot size={56} mood="cheer" className="shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <Star8 className="h-4 w-4 text-terracotta" />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
                Suffa
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
          </div>
        </div>

        <p className="text-sm text-ink-3">
          Community-run homeschool pods where the software carries the curriculum, so
          learning doesn&apos;t stop when a volunteer moves on.
        </p>

        {error ? (
          <p className="rounded-[var(--radius)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-[color:var(--ink)]">
            {error}
          </p>
        ) : null}

        <form
          action={signInAction}
          className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
        >
          <input type="hidden" name="next" value={next} />
          <label className="block text-sm">
            <span className="text-ink-2">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-2">Password</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
          >
            Sign in
          </button>
        </form>

        <p className="text-center text-sm text-ink-3">
          New here?{" "}
          <Link href="/signup" className="text-teal underline underline-offset-2">
            Create an account
          </Link>
        </p>

        <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-4">
            Try the demo
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {(["admin", "parent", "student"] as const).map((role) => (
              <form key={role} action={demoAsAction}>
                <input type="hidden" name="role" value={role} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border-strong bg-surface px-3 text-xs capitalize text-ink-2 transition-colors hover:border-teal hover:text-teal"
                >
                  {role === "parent" ? "family" : role}
                </button>
              </form>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-4">
            Or sign in with the seeded accounts: <code>admin@suffa.demo</code> /{" "}
            <code>parent@suffa.demo</code> / <code>student@suffa.demo</code>.
          </p>
        </div>

        <p className="flex flex-wrap justify-center gap-4 text-xs text-ink-4">
          <Link href="/terms" className="hover:text-teal">Terms</Link>
          <Link href="/privacy" className="hover:text-teal">Privacy</Link>
          <Link href="/acceptable-use" className="hover:text-teal">Acceptable use</Link>
        </p>
      </div>
    </div>
  );
}
