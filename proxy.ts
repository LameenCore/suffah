// Proxy (Next 16, formerly "middleware"). Refreshes the Supabase session on every request so Server Components read
// a current session, and bounces unauthenticated visitors away from the
// dashboards (route guards in each layout are the real check; this is a fast
// redirect). The dev-role cookie path is left untouched.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED = ["/admin", "/parent", "/student", "/volunteer"];
const DEV_ROLE_COOKIE = "suffa-dev-role";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const needsAuth = PROTECTED.some((p) => path === p || path.startsWith(`${p}/`));
  const hasDevRole = Boolean(
    request.cookies.get(DEV_ROLE_COOKIE)?.value ?? process.env.NEXT_PUBLIC_SUFFA_DEV_ROLE,
  );

  if (needsAuth && !user && !hasDevRole) {
    const to = request.nextUrl.clone();
    to.pathname = "/login";
    to.searchParams.set("next", path);
    return NextResponse.redirect(to);
  }

  return response;
}

export const config = {
  // Everything except static assets + the Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
