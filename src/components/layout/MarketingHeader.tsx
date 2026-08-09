import Link from "next/link";
import type { Account } from "@/lib/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { HWatermark } from "@/components/layout/HWatermark";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { AccountIcon } from "@/components/layout/icons";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { LinkButton } from "@/components/ui/Button";
import { withLocale } from "@/i18n/paths";

export function MarketingHeader({
  account,
  locale,
  dict,
}: {
  account: Account | null;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-stone-300 bg-stone-50/95 backdrop-blur">
      <HWatermark className="-top-16 right-6 text-[13rem] text-ink/[0.1]" />
      {/* Flex, not a 1fr/auto/1fr grid — the desktop nav on the left and the icon cluster
          on the right are different widths, and a grid's equal-fr columns would drag the
          logo off true center. `justify-between` plus an absolutely centered logo keeps it
          centered regardless of how wide either side is — on desktop. Below `lg`, true
          centering isn't safe: a signed-in header's icon cluster (language + search +
          account + cart) is wide enough that a dead-centered logo can still run into it on
          a narrow phone even though nothing moved. Below `lg` the logo instead sits inline
          next to the hamburger — its own natural width, no collision math required. */}
      <div className="relative mx-auto flex h-(--shell-header-h) max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-2">
          <MainNav account={account} />
          <Link href={withLocale(locale, "/")} aria-label={dict.nav.homeAriaLabel} className="flex items-center lg:hidden">
            <Logo />
          </Link>
        </div>

        <Link
          href={withLocale(locale, "/")}
          aria-label={dict.nav.homeAriaLabel}
          className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center justify-center lg:flex"
        >
          <Logo />
        </Link>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {/* Anonymous desktop visitors previously had no way to reach this without opening
              the hamburger drawer; now that the drawer is mobile-only, give it a quiet,
              explicit entry point next to the account icon. */}
          {/* The wrapping div (not a `hidden`/`lg:` class on the button itself) carries the
              responsive display — LinkButton's own base classes already set `inline-flex`
              unconditionally, and `cn` here is plain clsx with no conflict resolution, so an
              unprefixed `hidden` alongside it would race that base class for the `display`
              property instead of reliably losing below `lg`. */}
          {!account && (
            <div className="hidden lg:block">
              <LinkButton href={withLocale(locale, "/apply")} variant="secondary" size="sm">
                {dict.nav.applyForAccess}
              </LinkButton>
            </div>
          )}
          <LanguageSwitcher />
          {/* Search previews wholesale pricing and Cart needs its provider — both stay
              behind login here, same as the catalog itself; anonymous visitors get the
              account icon only, which routes them to /login. */}
          {account && <SearchOverlay />}
          {/* Signed in, the icon opens the account menu (same as the shop header);
              anonymous visitors have nothing to put in a menu, so it stays a link. */}
          {account ? (
            <AccountMenu account={account} />
          ) : (
            <Link
              href={withLocale(locale, "/login")}
              aria-label={dict.account.logIn}
              className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-signal"
            >
              <AccountIcon />
            </Link>
          )}
          {account && <CartDrawer />}
        </div>
      </div>
    </header>
  );
}
