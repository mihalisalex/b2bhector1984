import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getAllStyles } from "@/lib/data/styles";
import { CatalogProvider } from "@/lib/catalog-context";
import { CartProvider } from "@/lib/cart-context";
import { ShopHeader } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";
import { FloatingQuickOrder } from "@/components/layout/FloatingQuickOrder";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const styles = await getAllStyles();

  return (
    <CatalogProvider styles={styles}>
      <CartProvider accountId={account.id}>
        <ShopHeader account={account} />
        <main className="flex-1 bg-stone-50">{children}</main>
        <ShopFooter account={account} />
        <FloatingQuickOrder />
      </CartProvider>
    </CatalogProvider>
  );
}
