import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getStorefrontStyles } from "@/lib/data/styles";
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

  const [styles, dict] = await Promise.all([getStorefrontStyles(), getDictionary(lang)]);

  return (
    <CatalogProvider styles={styles}>
      <CartProvider accountId={account.id} priceMultiplier={account.priceMultiplier}>
        <ShopHeader account={account} locale={lang} dict={dict} />
        <main className="flex-1 bg-stone-50">{children}</main>
        <ShopFooter account={account} locale={lang} dict={dict} />
      </CartProvider>
    </CatalogProvider>
  );
}
