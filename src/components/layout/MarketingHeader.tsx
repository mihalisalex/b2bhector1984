import Link from "next/link";
import { getCurrentAccount } from "@/lib/session";
import { Logo } from "@/components/layout/Logo";
import { MainNav } from "@/components/layout/MainNav";

export async function MarketingHeader() {
  const account = await getCurrentAccount();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-300 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex h-(--shell-header-h) max-w-[1440px] items-center gap-4 px-6 lg:px-10">
        <MainNav account={account} />
        <Link href="/" className="flex items-center gap-3" aria-label="Hector 1984 home">
          <Logo />
        </Link>
      </div>
    </header>
  );
}
