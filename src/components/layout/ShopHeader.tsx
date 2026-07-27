import Link from "next/link";
import type { Account } from "@/lib/types";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { CartBadge } from "@/components/layout/CartBadge";
import { TierBadge } from "@/components/ui/Badge";

export function ShopHeader({ account }: { account: Account }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-stone-50/97 backdrop-blur print:hidden">
      <div className="mx-auto flex h-(--shell-header-h) max-w-[1600px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <MainNav account={account} />
          <Link href="/dashboard" aria-label="Hector 1984 wholesale home">
            <Logo />
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <span className="hidden sm:block">
            <TierBadge tier={account.tier} />
          </span>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}
