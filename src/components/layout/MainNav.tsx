"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/cn";
import { HWatermark } from "@/components/layout/HWatermark";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/quick-order", label: "Quick Order" },
  { href: "/catalog", label: "Catalogue" },
  { href: "/brand-story", label: "The Brand" },
  { href: "/contact", label: "Contact" },
  { href: "/dashboard", label: "Wholesale Dashboard" },
];

export function MainNav({ account }: { account: Account | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  // Portal target isn't available during SSR; the drawer renders after mount.
  useEffect(() => setMounted(true), []);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] border border-stone-300 hover:border-ink"
      >
        <span className="h-[1.5px] w-4 bg-ink" aria-hidden />
        <span className="h-[1.5px] w-4 bg-ink" aria-hidden />
        <span className="h-[1.5px] w-4 bg-ink" aria-hidden />
      </button>

      {mounted &&
        createPortal(
          <>
            {/* A `fixed` element inside an ancestor with backdrop-blur/filter is clipped to
                that ancestor's box (it becomes the containing block) — portal to <body> so
                the drawer is positioned against the viewport instead. */}
            <div
              className={cn(
                "fixed inset-0 z-50 bg-ink/40 transition-opacity",
                open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
              )}
              onClick={() => setOpen(false)}
              aria-hidden={!open}
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Main menu"
              className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col overflow-hidden border-r border-stone-300 bg-stone-50 transition-transform duration-300 ease-out",
                open ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <HWatermark className="-right-16 -top-10 text-[22rem] text-ink/[0.4]" />

              <div className="relative flex items-center justify-between border-b border-stone-300 px-5 py-4">
                <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Menu</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-8 w-8 items-center justify-center text-ink hover:text-signal"
                >
                  ✕
                </button>
              </div>

              <nav className="relative flex flex-1 flex-col gap-1 px-5 py-6" aria-label="Primary">
                {LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex items-center justify-between border-b border-stone-200 py-3 font-display text-lg font-bold uppercase tracking-tight text-ink transition-colors duration-150 hover:text-signal"
                  >
                    {item.label}
                    <span
                      aria-hidden
                      className="translate-x-1 text-signal opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                    >
                      →
                    </span>
                  </Link>
                ))}
              </nav>

              <div className="relative border-t border-stone-300 bg-stone-100 px-5 py-5">
                {account ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{account.contactName}</p>
                      <p className="text-xs text-ink-soft">{account.businessName}</p>
                    </div>
                    <Link href="/dashboard/assortments" className="text-sm font-medium text-ink-soft hover:text-ink">
                      Saved assortments
                    </Link>
                    <form action={logout}>
                      <button type="submit" className="text-sm font-medium text-ember hover:underline">
                        Sign out
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <Link
                      href="/apply"
                      className="bg-ink px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
                    >
                      Apply for Access
                    </Link>
                    <Link
                      href="/login"
                      className="border border-ink px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
                    >
                      Buyer Login
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
