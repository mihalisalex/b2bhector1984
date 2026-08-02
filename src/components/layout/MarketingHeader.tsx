import Link from "next/link";
import type { Account } from "@/lib/types";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { HWatermark } from "@/components/layout/HWatermark";
import { SearchOverlay } from "@/components/layout/SearchOverlay";
import { CartBadge } from "@/components/layout/CartBadge";
import { AccountIcon } from "@/components/layout/icons";
import { AccountMenu } from "@/components/layout/AccountMenu";

export function MarketingHeader({ account }: { account: Account | null }) {
  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-stone-300 bg-stone-50/95 backdrop-blur">
      <HWatermark className="-top-16 right-6 text-[13rem] text-ink/[0.1]" />
      <div className="relative mx-auto grid h-(--shell-header-h) max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 lg:px-10">
        <div className="flex items-center">
          <MainNav account={account} />
        </div>

        <Link href="/" className="flex items-center justify-center" aria-label="Hector 1984 home">
          <Logo />
        </Link>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
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
              href="/login"
              aria-label="Log in"
              className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-signal"
            >
              <AccountIcon />
            </Link>
          )}
          {account && <CartBadge />}
        </div>
      </div>
    </header>
  );
}
