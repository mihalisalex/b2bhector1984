"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ToastProvider } from "@/components/ui/ToastProvider";

const STORAGE_KEY = "hector_admin_theme";

/**
 * Client shell for the admin dashboard — holds dark/light theme state and
 * sets `data-admin-theme` on ITS OWN wrapper div (not `<html>`), so the CSS
 * variable overrides in globals.css (`[data-admin-theme="dark"]`) only ever
 * affect what's rendered inside here. The public storefront stays on its
 * settled light-only design regardless of what an admin picks.
 */
export function AdminShell({
  navItems,
  logoutAction,
  children,
}: {
  navItems: { href: string; label: string }[];
  logoutAction: () => void;
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a browser-only API (localStorage) at mount, not derived from React state
    if (stored === "dark") setTheme("dark");
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return (
    <div data-admin-theme={theme} className="flex min-h-screen flex-col bg-stone-50">
      <ToastProvider>
        <header className="border-b border-stone-300 bg-ink text-stone-200">
          <div className="mx-auto flex min-h-14 max-w-[1400px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-6 py-2 lg:px-10">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
              <span className="font-display text-sm font-bold uppercase tracking-tight text-white">
                Hector 1984 — Admin
              </span>
              <nav className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Admin">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-xs font-medium uppercase tracking-wide text-stone-300/80 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                className="text-xs font-medium uppercase tracking-wide text-stone-300/80 hover:text-white"
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </button>
              <form action={logoutAction}>
                <button type="submit" className="text-xs font-medium uppercase tracking-wide text-stone-300/80 hover:text-white">
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-6 py-8 lg:px-10">{children}</main>
      </ToastProvider>
    </div>
  );
}
