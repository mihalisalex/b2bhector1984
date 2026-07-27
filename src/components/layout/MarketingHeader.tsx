import Link from "next/link";
import { getCurrentAccount } from "@/lib/session";
import { LinkButton } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

const NAV = [
  { href: "/brand-story", label: "The Brand" },
  { href: "/collections", label: "Collections" },
  { href: "/apply", label: "Wholesale Access" },
];

export async function MarketingHeader() {
  const account = await getCurrentAccount();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex h-(--shell-header-h) max-w-[1440px] items-center justify-between px-6 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Hector 1984 home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
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

        <div className="flex items-center gap-3">
          {account ? (
            <LinkButton href="/dashboard" variant="primary" size="sm">
              Buyer Dashboard
            </LinkButton>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                Buyer Login
              </LinkButton>
              <LinkButton href="/apply" variant="primary" size="sm">
                Apply for Access
              </LinkButton>
            </>
          )}
        </div>
      </div>

      <nav className="flex items-center gap-5 overflow-x-auto border-t border-stone-200 px-6 py-2 md:hidden" aria-label="Primary">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap text-xs font-medium uppercase tracking-wide text-ink-soft hover:text-ink"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
