import Link from "next/link";
import { getCurrentAccount } from "@/lib/session";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";
import { HWatermark } from "@/components/layout/HWatermark";
import { LinkButton } from "@/components/ui/Button";

export async function MarketingHeader() {
  const account = await getCurrentAccount();

  return (
    <header className="sticky top-0 z-40 overflow-hidden border-b border-stone-300 bg-stone-50/95 backdrop-blur">
      <HWatermark className="-top-16 right-6 text-[13rem] text-ink/[0.1]" />
      <div className="relative mx-auto flex h-(--shell-header-h) max-w-[1440px] items-center justify-between gap-4 px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <MainNav account={account} />
          <Link href="/" className="flex items-center gap-3" aria-label="Hector 1984 home">
            <Logo />
          </Link>
        </div>
        <LinkButton href={account ? "/dashboard/account" : "/login"} variant="secondary" size="sm">
          {account ? "Account" : "Log In"}
        </LinkButton>
      </div>
    </header>
  );
}
