import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { getInventoryForStyles } from "@/lib/data/inventory";
import { CatalogProvider } from "@/lib/catalog-context";
import { CartProvider } from "@/lib/cart-context";
import { ShopHeader } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // string, not Locale — see the comment on src/app/[lang]/layout.tsx's params type.
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = rawLang as Locale;
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const [styles, hero, dict] = await Promise.all([getStorefrontStyles(), getHomepageHero(), getDictionary(lang)]);
  // Checkout-preview only (see catalog-context.tsx) — cheap at this catalog's size, and
  // shared by every ordering component instead of a page-by-page fetch.
  const inventory = await getInventoryForStyles(styles.map((s) => s.id));

  return (
    <CatalogProvider styles={styles} productionLeadTimeDays={hero.productionLeadTimeDays} inventory={inventory}>
      <CartProvider accountId={account.id} priceMultiplier={account.priceMultiplier} minOrderPairs={account.minOrderPairs}>
        <ShopHeader account={account} locale={lang} dict={dict} />
        <main className="flex-1 bg-stone-50">{children}</main>
        <ShopFooter account={account} locale={lang} dict={dict} />
      </CartProvider>
    </CatalogProvider>
  );
}
