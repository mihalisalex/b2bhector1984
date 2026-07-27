import Link from "next/link";
import { logout } from "@/lib/actions";
import type { Account } from "@/lib/types";
import { Logo } from "@/components/layout/Logo";
import { CartBadge } from "@/components/layout/CartBadge";
import { TierBadge } from "@/components/ui/Badge";

const NAV = [
  { href: "/catalog", label: "Catalog" },
  { href: "/linesheet", label: "Linesheet" },
  { href: "/quick-order", label: "Quick Order" },
  { href: "/dashboard", label: "Dashboard" },
];

export function ShopHeader({ account }: { account: Account }) {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-stone-50/97 backdrop-blur print:hidden">
      <div className="mx-auto flex h-(--shell-header-h) max-w-[1600px] items-center justify-between gap-2 px-4 sm:gap-6 sm:px-6 lg:px-10">
        <div className="flex items-center gap-10">
          <Link href="/dashboard" aria-label="Hector 1984 wholesale home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium uppercase tracking-wide text-ink-soft transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <span className="hidden sm:block">
            <TierBadge tier={account.tier} />
          </span>
          <details className="group relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 whitespace-nowrap border border-stone-300 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink hover:border-ink [&::-webkit-details-marker]:hidden">
              <span className="max-w-[6rem] truncate sm:max-w-[10rem]">{account.businessName}</span>
              <span aria-hidden className="text-cinder">▾</span>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-64 border border-stone-300 bg-white p-4 shadow-lg">
              <p className="text-sm font-semibold text-ink">{account.contactName}</p>
              <p className="text-xs text-ink-soft">{account.email}</p>
              <div className="mt-3 flex flex-col gap-1 border-t border-stone-200 pt-3 text-sm">
                <Link href="/dashboard" className="py-1 text-ink-soft hover:text-ink">Dashboard</Link>
                <Link href="/dashboard/assortments" className="py-1 text-ink-soft hover:text-ink">Saved assortments</Link>
                <Link href="/quick-order" className="py-1 text-ink-soft hover:text-ink">Quick order</Link>
              </div>
              <form action={logout} className="mt-3 border-t border-stone-200 pt-3">
                <button type="submit" className="text-sm font-medium text-ember hover:underline">
                  Sign out
                </button>
              </form>
            </div>
          </details>
          <CartBadge />
        </div>
      </div>
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-stone-200 px-6 py-2 lg:hidden" aria-label="Primary">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-ink-soft hover:text-ink">
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
