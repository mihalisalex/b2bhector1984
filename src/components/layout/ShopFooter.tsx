import Link from "next/link";
import type { Account } from "@/lib/types";

export function ShopFooter({ account }: { account: Account }) {
  return (
    <footer className="border-t border-stone-300 bg-stone-100 print:hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-6 py-6 text-xs text-ink-soft md:flex-row md:items-center md:justify-between lg:px-10">
        <span>
          Your rep: {account.rep.name} · {account.rep.email} · {account.rep.phone}
        </span>
        <span className="flex gap-4">
          <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
          <a href="mailto:wholesale@hectorfootwear.gr" className="hover:text-ink">Support</a>
        </span>
      </div>
    </footer>
  );
}
