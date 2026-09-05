import { Sidebar, type NavItem } from "@/components/Sidebar";
import { env } from "@/lib/env";
import type { SessionUser } from "@/lib/types";

/** App shell: left sidebar (drawer on mobile) + content column. */
export function DashboardChrome({
  user,
  nav,
  wide = false,
  children,
}: {
  user: SessionUser;
  nav: NavItem[];
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full bg-bg">
      <Sidebar
        user={user}
        items={nav}
        demoReset={env.demoMode && user.role === "admin"}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <main
          className={`mx-auto w-full flex-1 px-5 py-8 sm:px-8 ${
            wide ? "max-w-6xl" : "max-w-4xl"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
