"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { ToastProvider } from "@/components/ui/ToastProvider";

const STORAGE_KEY = "hector_admin_theme";

export interface AdminNavSection {
  title: string;
  items: { href: string; label: string }[];
}

/**
 * `/admin` is a prefix of every other admin route, so it only lights up on its
 * own page (or an order detail, which has no nav entry of its own). Everything
 * else also matches its own sub-routes, so `/admin/products/[id]` keeps
 * "Products" highlighted.
 */
function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/orders");
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Client shell for the admin dashboard — holds dark/light theme state and
 * sets `data-admin-theme` on ITS OWN wrapper div (not `<html>`), so the CSS
 * variable overrides in globals.css (`[data-admin-theme="dark"]`) only ever
 * affect what's rendered inside here. The public storefront stays on its
 * settled light-only design regardless of what an admin picks.
 *
 * Navigation is a persistent left sidebar from `lg` up, and the same content
 * in a slide-out drawer below that. The drawer is deliberately NOT portaled to
 * `<body>` (unlike the storefront's `MainNav`): nothing above it creates a
 * containing block, and staying inside the wrapper keeps it within the
 * `data-admin-theme` scope so dark mode applies to it too.
 */
export function AdminShell({
  navSections,
  logoutAction,
  children,
}: {
  navSections: AdminNavSection[];
  logoutAction: () => void;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [open, setOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useFocusTrap(drawerRef, open);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only API (localStorage) at mount, not derived from React state
    if (stored === "dark") setTheme("dark");
  }, []);

  // Close the drawer on navigation.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <div data-admin-theme={theme} className="min-h-screen bg-stone-50">
      <ToastProvider>
        <div className="lg:flex">
          {/* Desktop: always-visible sidebar. Sticky + own scroll so a long nav
              never pushes the page or scrolls away from the content. */}
          <aside className="sticky top-0 z-20 hidden h-screen w-60 shrink-0 flex-col border-r border-stone-300 bg-ink lg:flex">
            <AdminBrand />
            <Divider />
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <AdminNav sections={navSections} pathname={pathname} />
            </div>
            <Divider />
            <AdminSidebarFooter theme={theme} onToggleTheme={toggleTheme} logoutAction={logoutAction} />
          </aside>

          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-stone-300 bg-ink px-4 py-3 lg:hidden">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Open admin menu"
                aria-expanded={open}
                className="group flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[6px]"
              >
                <span className="h-[1.5px] w-5 bg-white" aria-hidden />
                <span className="h-[1.5px] w-5 bg-white" aria-hidden />
                <span className="h-[1.5px] w-5 bg-white" aria-hidden />
              </button>
              <span className="font-display text-sm font-bold uppercase tracking-tight text-white">
                Hector Footwear — Admin
              </span>
            </header>

            <main className="mx-auto w-full max-w-[1400px] px-6 py-8 lg:px-10">{children}</main>
          </div>
        </div>

        {/* Mobile drawer — same nav content as the sidebar. */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-ink/40 transition-opacity lg:hidden",
            open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setOpen(false)}
          aria-hidden={!open}
        />
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Admin menu"
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col bg-ink transition-transform duration-300 ease-out lg:hidden",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between pr-3">
            <AdminBrand />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close admin menu"
              className="flex h-8 w-8 items-center justify-center text-stone-300/80 hover:text-white"
            >
              ✕
            </button>
          </div>
          <Divider />
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <AdminNav sections={navSections} pathname={pathname} />
          </div>
          <Divider />
          <AdminSidebarFooter theme={theme} onToggleTheme={toggleTheme} logoutAction={logoutAction} />
        </div>
      </ToastProvider>
    </div>
  );
}

/**
 * Hairline rule drawn with a background, not a border: globals.css sets
 * `* { border-color: var(--color-stone-300) }` *outside* any cascade layer, and
 * unlayered declarations beat Tailwind's layered `border-*` color utilities — so
 * every border on this dark sidebar would render as light gray no matter what
 * class it carries. Background utilities aren't affected.
 */
function Divider() {
  return <div className="h-px shrink-0 bg-white/10" aria-hidden />;
}

function AdminBrand() {
  return (
    <Link href="/admin" className="block px-5 py-4">
      <span className="font-display block text-sm font-bold uppercase tracking-tight text-white">
        Hector Footwear
      </span>
      <span className="font-mono-tab mt-0.5 block text-[10px] uppercase tracking-[0.2em] text-stone-300/60">
        Admin
      </span>
    </Link>
  );
}

function AdminNav({ sections, pathname }: { sections: AdminNavSection[]; pathname: string }) {
  return (
    <nav className="flex flex-col gap-6" aria-label="Admin">
      {sections.map((section) => (
        <div key={section.title}>
          <h2 className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-300/45">
            {section.title}
          </h2>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-stone-300/80 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {active && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-white" />}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AdminSidebarFooter({
  theme,
  onToggleTheme,
  logoutAction,
}: {
  theme: "light" | "dark";
  onToggleTheme: () => void;
  logoutAction: () => void;
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-4">
      <Link
        href="/"
        className="px-3 py-2 text-sm font-medium text-stone-300/80 transition-colors hover:text-white"
      >
        View storefront
      </Link>
      <button
        type="button"
        onClick={onToggleTheme}
        className="px-3 py-2 text-left text-sm font-medium text-stone-300/80 transition-colors hover:text-white"
      >
        {theme === "dark" ? "Light mode" : "Dark mode"}
      </button>
      <form action={logoutAction}>
        <button
          type="submit"
          className="w-full px-3 py-2 text-left text-sm font-medium text-stone-300/80 transition-colors hover:text-white"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
