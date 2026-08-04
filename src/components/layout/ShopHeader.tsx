import Link from "next/link";
import type { Account } from "@/lib/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { HWatermark } from "@/components/layout/HWatermark";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { AccountMenu } from "@/components/layout/AccountMenu";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { withLocale } from "@/i18n/paths";

export function ShopHeader({ account, locale, dict }: { account: Account; locale: Locale; dict: Dictionary }) {
  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-stone-300 bg-stone-50/97 backdrop-blur print:hidden">
      <HWatermark className="-top-16 right-6 text-[13rem] text-ink/[0.1]" />
      <div className="relative mx-auto grid h-(--shell-header-h) max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center">
          <MainNav account={account} />
        </div>

        {/* The homepage, matching the marketing header's logo and the nav's "Home" —
            the buyer's dashboard is reachable from the account menu instead. */}
        <Link href={withLocale(locale, "/")} aria-label={dict.nav.homeAriaLabel} className="flex items-center justify-center">
          <Logo />
        </Link>

        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <LanguageSwitcher />
          <SearchOverlay />
          <AccountMenu account={account} />
          <CartDrawer />
        </div>
      </div>
    </header>
  );
}
