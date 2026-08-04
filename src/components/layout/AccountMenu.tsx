"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/actions";
import type { Account } from "@/lib/types";
import { AccountIcon } from "@/components/layout/icons";
import { useI18n } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";

/**
 * The account icon opens the buyer's own links instead of jumping straight to account
 * settings — signing out previously meant opening the main drawer and scrolling past the
 * whole site nav to reach it.
 *
 * Rendered through a portal, not as an absolutely-positioned child: the header sets
 * `overflow-hidden` to clip the oversized H watermark, which would clip this too. That
 * means position has to be measured from the trigger rather than inherited, so the panel
 * is placed against the button's viewport rect and re-measured on resize and scroll.
 */
export function AccountMenu({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { locale, dict } = useI18n();

  const LINKS = useMemo(
    () => [
      { href: "/dashboard", label: dict.account.dashboard },
      { href: "/cart", label: dict.account.cart },
      { href: "/dashboard/account", label: dict.account.accountSettings },
      { href: "/dashboard/favorites", label: dict.account.favorites },
      { href: "/dashboard/assortments", label: dict.account.savedAssortments },
    ],
    [dict],
  );

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  // Close on navigation — the panel outlives the click that triggered it otherwise.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  // Measured before paint so the panel never renders at the wrong spot for a frame.
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = buttonRef.current?.getBoundingClientRect();
      if (r) setPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    };
    place();
    window.addEventListener("resize", place);
    // `true` so it also follows scrolls inside any scrollable ancestor, not just the page.
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus(); // Escape must return focus to the trigger, not the page.
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={dict.account.accountMenu}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-signal"
      >
        <AccountIcon />
      </button>

      {mounted &&
        open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            aria-label={dict.account.accountLabel}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-50 w-60 border border-stone-300 bg-stone-50 shadow-[0_18px_44px_rgba(0,0,0,0.16)]"
          >
            <Link
              href={withLocale(locale, "/dashboard/account")}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="group block border-b border-stone-300 bg-stone-100 px-4 py-3"
            >
              <p className="truncate text-sm font-semibold text-ink group-hover:text-signal">{account.contactName}</p>
              <p className="truncate text-xs text-ink-soft">{account.businessName}</p>
            </Link>

            <div className="flex flex-col py-1">
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={withLocale(locale, l.href)}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-ink-soft hover:bg-stone-100 hover:text-ink"
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <form action={logout} className="border-t border-stone-300">
              <button
                type="submit"
                role="menuitem"
                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-ember hover:bg-ember-100"
              >
                {dict.account.signOut}
              </button>
            </form>
          </div>,
          document.body,
        )}
    </>
  );
}
