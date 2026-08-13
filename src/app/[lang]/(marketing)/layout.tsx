import { getCurrentAccount } from "@/lib/session";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { CatalogProvider } from "@/lib/catalog-context";
import { CartProvider } from "@/lib/cart-context";
import { HomeAnnouncementBar } from "@/components/layout/HomeAnnouncementBar";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";

export default async function MarketingLayout({
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

  const content = (
    <>
      <HomeAnnouncementBar
        enabled={hero.announcementEnabled}
        text={hero.announcementText}
        href={hero.announcementHref}
        color={hero.announcementColor}
      />
      <MarketingHeader account={account} locale={lang} dict={dict} />
      <main className="flex-1">{children}</main>
      <Footer locale={lang} dict={dict} />
    </>
  );

  // A logged-in buyer's cart persists even while browsing marketing pages
  // (brand story, FAQ, etc.) — only wrap in the cart's providers when there's
  // an account to scope it to; anonymous visitors have no cart to show.
  if (!account) return content;

  const styles = await getStorefrontStyles();
  // Empty, not fetched: nothing under the marketing tree reads live stock through this
  // context (product-bearing marketing pages pass their own `inventory` prop directly,
  // same as the catalogue) — checkout (the one consumer of context inventory) only ever
  // renders under the shop tree, which fetches the real thing in its own layout.
  return (
    <CatalogProvider styles={styles} productionLeadTimeDays={hero.productionLeadTimeDays} inventory={{}}>
      <CartProvider accountId={account.id} priceMultiplier={account.priceMultiplier} minOrderPairs={account.minOrderPairs}>
        {content}
      </CartProvider>
    </CatalogProvider>
  );
}
