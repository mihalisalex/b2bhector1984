import { getCurrentAccount } from "@/lib/session";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { getInventoryForStyles } from "@/lib/data/inventory";
import { CatalogProvider } from "@/lib/catalog-context";
import { CartProvider } from "@/lib/cart-context";
import { HomeAnnouncementBar } from "@/components/layout/HomeAnnouncementBar";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";
import { ShopHeader } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";

/**
 * The two merchandising surfaces — the catalogue and a product page — that are
 * readable without a login. Everything else that was in `(shop)` stays there and
 * stays behind that group's `redirect("/login")`.
 *
 * Why a route group rather than a flag: the public/private split is now a fact
 * about where a file lives, which cannot drift. The previous arrangement kept
 * the same split in a hand-maintained string list in `seoRoutes.ts`, and that
 * list has drifted from reality before. `/cart` and `/quick-order` in
 * particular have no account guard of their own — they lean entirely on the
 * `(shop)` layout — so that guard had to stay exactly as strict as it was.
 *
 * A signed-in buyer gets byte-for-byte the same chrome and providers they got
 * when these pages lived under `(shop)`: shop header, shop footer, catalog and
 * cart context. An anonymous visitor gets the marketing chrome that the
 * homepage, brand story and apply pages already use, and no cart providers at
 * all — there is nothing to put in a cart without an account to scope it to.
 *
 * The pages themselves decide what an anonymous visitor may see; this layout
 * only decides the shell. See the `showPricing` prop threaded through the
 * product and catalogue pages — trade prices are for approved accounts.
 */
export default async function CatalogLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // string, not Locale — see the comment on src/app/[lang]/layout.tsx's params type.
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = rawLang as Locale;
  const [account, hero, dict] = await Promise.all([getCurrentAccount(), getHomepageHero(), getDictionary(lang)]);

  if (!account) {
    return (
      <>
        <HomeAnnouncementBar
          enabled={hero.announcementEnabled}
          text={hero.announcementText}
          href={hero.announcementHref}
          color={hero.announcementColor}
        />
        <MarketingHeader account={null} locale={lang} dict={dict} />
        <main className="flex-1 bg-stone-50">{children}</main>
        <Footer locale={lang} dict={dict} />
      </>
    );
  }

  const styles = await getStorefrontStyles();
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
