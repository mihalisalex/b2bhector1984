import { getCurrentAccount } from "@/lib/session";
import { getStorefrontStyles } from "@/lib/data/styles";
import { CatalogProvider } from "@/lib/catalog-context";
import { CartProvider } from "@/lib/cart-context";
import { MarketingHeader } from "@/components/layout/MarketingHeader";
import { Footer } from "@/components/layout/Footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();

  const content = (
    <>
      <MarketingHeader account={account} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );

  // A logged-in buyer's cart persists even while browsing marketing pages
  // (brand story, FAQ, etc.) — only wrap in the cart's providers when there's
  // an account to scope it to; anonymous visitors have no cart to show.
  if (!account) return content;

  const styles = await getStorefrontStyles();
  return (
    <CatalogProvider styles={styles}>
      <CartProvider accountId={account.id} priceMultiplier={account.priceMultiplier}>
        {content}
      </CartProvider>
    </CatalogProvider>
  );
}
