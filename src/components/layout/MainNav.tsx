"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/cn";
import { HWatermark } from "@/components/layout/HWatermark";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useI18n } from "@/i18n/I18nProvider";
import { stripLocale, withLocale } from "@/i18n/paths";

export function MainNav({ account }: { account: Account | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { locale, dict } = useI18n();

  /** Where a buyer goes to place an order — the drawer's main menu. */
  const LINKS = useMemo(
    () => [
      { href: "/", label: dict.nav.home },
      { href: "/quick-order", label: dict.nav.quickOrder },
      { href: "/catalogue", label: dict.nav.catalogue },
    ],
    [dict],
  );

  /** Company/reference pages. Same typographic treatment, set apart at the foot of the
   * drawer so they don't compete with the ordering routes above. */
  const SECONDARY_LINKS = useMemo(
    () => [
      { href: "/brand-story", label: dict.nav.theBrand },
      { href: "/journal", label: dict.nav.journal },
      { href: "/faq", label: dict.nav.faq },
      { href: "/contact", label: dict.nav.contact },
    ],
    [dict],
  );

  const activePath = stripLocale(pathname).path;

  useFocusTrap(dialogRef, open);

  // Portal target isn't available during SSR; the drawer renders after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.nav.openMenu}
        aria-expanded={open}
        className="group flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[6px]"
      >
        <span className="h-[1.5px] w-5 bg-ink transition-colors group-hover:bg-signal" aria-hidden />
        <span className="h-[1.5px] w-5 bg-ink transition-colors group-hover:bg-signal" aria-hidden />
        <span className="h-[1.5px] w-5 bg-ink transition-colors group-hover:bg-signal" aria-hidden />
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
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={dict.nav.mainMenu}
              className={cn(
                "fixed inset-y-0 left-0 z-50 flex w-[300px] max-w-[85vw] flex-col overflow-hidden border-r border-stone-300 bg-stone-50 transition-transform duration-300 ease-out",
                open ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <HWatermark className="-right-16 -top-10 text-[22rem] text-ink/[0.4]" />

              <div className="relative flex items-center justify-between border-b border-stone-300 px-5 py-4">
                <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{dict.nav.menu}</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={dict.nav.closeMenu}
                  className="flex h-8 w-8 items-center justify-center text-ink hover:text-signal"
                >
                  ✕
                </button>
              </div>

              <nav className="relative flex flex-1 flex-col gap-1 px-5 py-6" aria-label="Primary">
                {LINKS.map((item) => (
                  <DrawerLink key={item.href} item={item} locale={locale} active={activePath === item.href} />
                ))}
              </nav>

              {/* The buyer's own links (dashboard, cart, sign out) used to live here;
                  they're in the account-icon menu now, so this space carries the company
                  pages instead — same type as the main menu, set apart on its own ground. */}
              <div className="relative border-t border-stone-300 bg-stone-100 px-5 py-4">
                <nav className="flex flex-col" aria-label="Company">
                  {SECONDARY_LINKS.map((item) => (
                    <DrawerLink key={item.href} item={item} locale={locale} active={activePath === item.href} />
                  ))}
                </nav>

                {!account && (
                  <div className="mt-4 flex flex-col gap-2.5">
                    <Link
                      href={withLocale(locale, "/apply")}
                      className="bg-ink px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
                    >
                      {dict.nav.applyForAccess}
                    </Link>
                    <Link
                      href={withLocale(locale, "/login")}
                      className="border border-ink px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
                    >
                      {dict.nav.buyerLogin}
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

/** One drawer row. Shared so the company links at the foot are typographically identical
 * to the main menu above them — the only difference is the ground they sit on. */
function DrawerLink({
  item,
  active,
  locale,
}: {
  item: { href: string; label: string };
  active: boolean;
  locale: Parameters<typeof withLocale>[0];
}) {
  return (
    <Link
      href={withLocale(locale, item.href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        // Body sans (Plus Jakarta Sans), not font-display: the drawer's link list reads as
        // navigation UI, not a headline, so it takes the site's modern rounded sans rather
        // than the Didot-style serif reserved for titles.
        "group flex items-center justify-between border-b py-3 text-lg font-bold uppercase tracking-tight transition-colors duration-150",
        active ? "border-ink text-signal" : "border-stone-200 text-ink hover:text-signal",
      )}
    >
      <span className="flex items-center gap-2">
        {active && <span className="h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />}
        {item.label}
      </span>
      <span
        aria-hidden
        className="translate-x-1 text-signal opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
      >
        →
      </span>
    </Link>
  );
}
