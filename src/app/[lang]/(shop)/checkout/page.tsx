import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentAccount } from "@/lib/session";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getDictionary } from "@/i18n/getDictionary";
import { withLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return { title: dict.dashboard.checkout, robots: { index: false, follow: false } };
}

export default async function CheckoutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const d = (await getDictionary(locale)).dashboard;
  const account = await getCurrentAccount();
  if (!account) redirect(withLocale(locale, "/login"));

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
      <nav className="mb-4 text-xs text-ink-soft">
        <Link href={withLocale(locale, "/cart")} className="hover:text-ink">
          {d.cart}
        </Link>{" "}
        <span className="mx-1">/</span> <span className="text-ink">{d.checkout}</span>
      </nav>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        {d.checkout}
      </h1>
      <CheckoutForm account={account} />
    </div>
  );
}
