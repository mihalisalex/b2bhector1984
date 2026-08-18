import Link from "next/link";
import type { Account } from "@/lib/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";

export function ShopFooter({ account, locale, dict }: { account: Account; locale: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t border-stone-300 bg-stone-100 print:hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-6 py-6 text-xs text-ink-soft md:flex-row md:items-center md:justify-between lg:px-10">
        {/* Two templates rather than one with an interpolated blank: dropping `{phone}` from
            the string leaves a dangling " · " separator in all four locales. */}
        <span>
          {account.rep.phone
            ? t(dict.shopFooter.yourRep, {
                name: account.rep.name,
                email: account.rep.email,
                phone: account.rep.phone,
              })
            : t(dict.shopFooter.yourRepNoPhone, { name: account.rep.name, email: account.rep.email })}
        </span>
        <span className="flex gap-4">
          <Link href={withLocale(locale, "/dashboard")} className="hover:text-ink">
            {dict.shopFooter.dashboard}
          </Link>
          <a href="mailto:info@hectorfootwear.gr" className="hover:text-ink">
            {dict.shopFooter.support}
          </a>
        </span>
      </div>
    </footer>
  );
}
