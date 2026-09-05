import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { signUpAction } from "@/app/signup/actions";
import { Star8 } from "@/components/ui/Motif";
import { Mascot } from "@/components/ui/Mascot";

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const user = await getCurrentUser();
  if (user) redirect(`/${user.role}`);

  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;

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
            <h1 className="font-display text-2xl font-semibold text-ink">Create an account</h1>
          </div>
        </div>

        {error ? (
          <p className="rounded-[var(--radius)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-[color:var(--ink)]">
            {error}
          </p>
        ) : null}

        <form
          action={signUpAction}
          className="space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-[var(--shadow-card)]"
        >
          <label className="block text-sm">
            <span className="text-ink-2">Name</span>
            <input
              name="name"
              required
              autoComplete="name"
              className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            />
          </label>
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
              minLength={8}
              autoComplete="new-password"
              className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            />
            <span className="mt-1 block text-[11px] text-ink-4">At least 8 characters.</span>
          </label>
          <label className="block text-sm">
            <span className="text-ink-2">I am a…</span>
            <select
              name="role"
              defaultValue="parent"
              className="mt-1 w-full rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-teal"
            >
              <option value="parent">Parent / guardian</option>
              <option value="student">Student</option>
              <option value="admin">Masjid admin</option>
            </select>
            <span className="mt-1 block text-[11px] text-ink-4">
              Demo: every account joins the demo masjid. In production a parent creates the
              child&apos;s account and consent gates it.
            </span>
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-teal px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-strong"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-sm text-ink-3">
          Already have an account?{" "}
          <Link href="/login" className="text-teal underline underline-offset-2">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-ink-4">
          By creating an account you agree to the{" "}
          <Link href="/terms" className="hover:text-teal underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="hover:text-teal underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
