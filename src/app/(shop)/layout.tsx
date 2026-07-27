import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { CartProvider } from "@/lib/cart-context";
import { ShopHeader } from "@/components/layout/ShopHeader";
import { ShopFooter } from "@/components/layout/ShopFooter";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  return (
    <CartProvider accountId={account.id} tier={account.tier}>
      <ShopHeader account={account} />
      <main className="flex-1 bg-stone-50">{children}</main>
      <ShopFooter account={account} />
    </CartProvider>
  );
}
