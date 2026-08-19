"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Account } from "@/lib/types";
import { cn } from "@/lib/cn";
import { HWatermark } from "@/components/layout/HWatermark";
import { LockIcon } from "@/components/layout/icons";
import { LinkButton } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useI18n } from "@/i18n/I18nProvider";
import { stripLocale, withLocale } from "@/i18n/paths";
import { isGatedPath } from "@/lib/seoRoutes";

export function MainNav({ account }: { account: Account | null }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { locale, dict } = useI18n();

  /** Where a buyer goes to place an order — the drawer's main menu.
   *
   * The padlock is derived from `isGatedPath`, not hand-maintained here. It used to be a
   * `locked: true` flag per link, and when /catalogue became publicly readable the flag
   * stayed behind — signed-out visitors were shown a padlock and "account required" on the
   * one page that had just been opened up specifically so they would find it. That is the
   * drift this file's own source of truth exists to prevent, so it now asks that source
   * directly and there is no second list to forget.
   *
   * It only ever renders for signed-out visitors, and only in this drawer: a padlock next to
   * a link a buyer can already open would be noise. */
  const LINKS = useMemo(
    () => [
      { href: "/", label: dict.nav.home },
      { href: "/collections", label: dict.nav.collections },
      { href: "/quick-order", label: dict.nav.quickOrder },
      { href: "/catalogue", label: dict.nav.catalogue },
    ],
    [dict],
  );

  /** The always-visible desktop row — deliberately shorter than the mobile drawer's full
   * list. The logo already routes home, and the company/reference pages below live in the
   * footer on every page, so the header stays a few confident words wide instead of packing
   * in every route it's possible to reach from here. */
  const DESKTOP_LINKS = useMemo(
    () => [
      { href: "/quick-order", label: dict.nav.quickOrder },
      { href: "/catalogue", label: dict.nav.catalogue },
      { href: "/brand-story", label: dict.nav.theBrand },
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
      {/* Desktop: a normal, visible text nav — no drawer involved. Understated weight and
          wide tracking keep it quiet next to the centered logo. */}
      <nav className="hidden items-center gap-9 lg:flex" aria-label="Primary">
        {DESKTOP_LINKS.map((item) => (
          <Link
            key={item.href}
            href={withLocale(locale, item.href)}
            aria-current={activePath === item.href ? "page" : undefined}
            className={cn(
              "text-[13px] font-medium uppercase tracking-[0.08em] transition-colors",
              activePath === item.href ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Mobile/tablet: unchanged hamburger + drawer, just scoped below the desktop nav's
          breakpoint instead of showing at every width. */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={dict.nav.openMenu}
        aria-expanded={open}
        className="group relative flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[6px] lg:hidden after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']"
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
                <IconButton size="sm" onClick={() => setOpen(false)} aria-label={dict.nav.closeMenu}>
                  ✕
                </IconButton>
              </div>

              <nav className="relative flex flex-1 flex-col gap-1 px-5 py-6" aria-label="Primary">
                {LINKS.map((item) => (
                  <DrawerLink
                    key={item.href}
                    item={item}
                    locale={locale}
                    active={activePath === item.href}
                    locked={!account && isGatedPath(item.href)}
                    lockedLabel={dict.nav.accountRequired}
                  />
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
                    <LinkButton href={withLocale(locale, "/apply")} className="w-full justify-center">
                      {dict.nav.applyForAccess}
                    </LinkButton>
                    <LinkButton href={withLocale(locale, "/login")} variant="secondary" className="w-full justify-center">
                      {dict.nav.buyerLogin}
                    </LinkButton>
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
  locked = false,
  lockedLabel,
}: {
  item: { href: string; label: string };
  active: boolean;
  locale: Parameters<typeof withLocale>[0];
  /** Signed-out visitor + a gated route. Still a real link — following it lands on /login
   * with a `next` param, which is a better introduction than an unclickable row. */
  locked?: boolean;
  lockedLabel?: string;
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
        {locked && (
          // Discreet by design: ink-soft rather than the link's own weight, so it reads as a
          // quiet annotation on the label instead of competing with it. The label text is
          // for screen readers only — the padlock itself is decorative.
          <span className="inline-flex items-center text-ink-soft/70" title={lockedLabel}>
            <LockIcon />
            <span className="sr-only">{lockedLabel}</span>
          </span>
        )}
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
