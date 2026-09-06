"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/types";
import { Star8 } from "@/components/ui/Motif";
import { DemoResetButton } from "@/components/DemoResetButton";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { useT } from "@/lib/i18n/client";
import { signOutAction } from "@/app/logout/actions";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const ROLE_LABEL_KEY: Record<
  SessionUser["role"],
  "roleLabel.admin" | "roleLabel.parent" | "roleLabel.student" | "roleLabel.volunteer"
> = {
  admin: "roleLabel.admin",
  parent: "roleLabel.parent",
  student: "roleLabel.student",
  volunteer: "roleLabel.volunteer",
};

function isActive(pathname: string, href: string, roots: string[]) {
  if (pathname === href) return true;
  if (roots.includes(href)) return false;
  return pathname.startsWith(`${href}/`) || pathname.startsWith(href);
}

export function Sidebar({
  user,
  items,
  demoReset = false,
}: {
  user: SessionUser;
  items: NavItem[];
  demoReset?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const t = useT();
  const roleLabel = t(ROLE_LABEL_KEY[user.role]);
  const roots = ["/admin", "/parent", "/student", "/volunteer"];

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Drawer a11y (T60): lock body scroll, trap focus, Escape closes, focus
  // returns to the Menu trigger on close.
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>("a, button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !drawer) return;
      const focusables = drawer.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      trigger?.focus();
    };
  }, [open]);

  const nav = (
    <nav aria-label={t("a11y.mainNav")} className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-4">
      {items.map((item) => {
        const active = isActive(pathname, item.href, roots);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex min-h-11 items-center gap-3 rounded-[var(--radius)] px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-terracotta-soft font-medium text-terracotta-strong"
                : "text-ink-2 hover:bg-surface-2"
            }`}
          >
            <span className={active ? "text-terracotta" : "text-ink-4"}>{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="rounded-full bg-terracotta px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const foot = (
    <div className="border-t border-border p-3">
      {demoReset ? (
        <div className="mb-1 px-1">
          <DemoResetButton />
        </div>
      ) : null}
      <div className="mb-1 flex justify-center px-1">
        <LocaleSwitch />
      </div>
      <Link
        href="/help"
        onClick={() => setOpen(false)}
        className="flex items-center justify-between rounded-[var(--radius)] px-3 py-2 text-sm text-ink-2 hover:bg-surface-2"
      >
        <span>{t("common.getHelp")}</span>
        <span aria-hidden>?</span>
      </Link>
      <div className="mt-1 flex items-center justify-between rounded-[var(--radius)] px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{user.name}</p>
          {user.name !== roleLabel ? (
            <p className="text-xs text-ink-4">{roleLabel}</p>
          ) : (
            <p className="truncate text-xs text-ink-4">{user.email}</p>
          )}
        </div>
        <form action={signOutAction} className="shrink-0">
          <button
            type="submit"
            className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-xs text-ink-3 transition-colors hover:border-teal hover:text-teal"
          >
            {t("common.signOut")}
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <Star8 className="h-6 w-6 text-terracotta" />
      <span className="font-display text-lg font-semibold text-ink">Suffa</span>
    </div>
  );

  return (
    <>
      {/* mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-surface/90 px-4 py-2.5 backdrop-blur md:hidden print:hidden">
        <div className="flex items-center gap-2">
          <Star8 className="h-5 w-5 text-terracotta" />
          <span className="font-display font-semibold text-ink">Suffa</span>
        </div>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-3.5 text-sm text-ink-2"
          aria-label={t("common.menu")}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          {t("common.menu")}
        </button>
      </div>

      {/* desktop rail */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-surface md:flex print:hidden">
        {brand}
        {nav}
        {foot}
      </aside>

      {/* mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("a11y.menuDialog")}
            className="absolute inset-y-0 left-0 flex w-64 flex-col bg-surface shadow-[var(--shadow-pop)]"
          >
            <div className="flex items-center justify-between pr-3">
              {brand}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="mr-1 inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-sm text-ink-3"
                aria-label={t("a11y.closeMenu")}
              >
                {t("common.close")}
              </button>
            </div>
            {nav}
            {foot}
          </div>
        </div>
      ) : null}
    </>
  );
}
