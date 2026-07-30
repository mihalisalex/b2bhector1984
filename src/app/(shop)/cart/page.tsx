import { getStorefrontStyles } from "@/lib/data/styles";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getInventoryForStyles } from "@/lib/data/inventory";
import { getCurrentAccount } from "@/lib/session";
import { getUnitPrice } from "@/lib/pricing";
import type { BoxOption } from "@/lib/orderMinimum";
import { CartView } from "@/components/cart/CartView";

export const metadata = { title: "Cart", robots: { index: false, follow: false } };

/**
 * Server shell for the cart. The cart itself lives in localStorage (client), but the
 * "complete your minimum" suggestions need real stock levels, and inventory is
 * server-only — so the orderable box list is built here and handed down, rather than
 * round-tripping an API call once the client discovers it's short.
 *
 * Restricted to available-now styles: the point of the suggestion is to complete
 * *this* order, so offering a pre-book style that ships next season would be a
 * misleading answer to "what closes my gap".
 */
export default async function CartPage() {
  const [styles, account] = await Promise.all([getStorefrontStyles(), getCurrentAccount()]);
  const priceMultiplier = account?.priceMultiplier ?? 1;
  const sellable = styles.filter((s) => s.availability === "available");
  // Every style, not just `sellable` — a cart line can reference a pre-book style too,
  // and the qty stepper below needs real stock for whatever's actually in the cart.
  const inventory = await getInventoryForStyles(styles.map((s) => s.id));

  const inStockOptions: BoxOption[] = [];
  for (const style of sellable) {
    const unitPrice = getUnitPrice(style, "net60", priceMultiplier);
    const imageUrl = getStyleImageUrl(style);
    for (const colorway of style.colorways) {
      for (const box of getAvailableBoxTypes(style)) {
        const onHand = inventory[style.id]?.[colorway.id]?.[box.id] ?? 0;
        if (onHand <= 0) continue;
        inStockOptions.push({
          styleId: style.id,
          styleName: style.name,
          slug: style.slug,
          styleNumber: style.styleNumber,
          imageUrl,
          colorwayId: colorway.id,
          colorwayName: colorway.name,
          swatch: colorway.swatch,
          boxTypeId: box.id,
          boxLabel: box.label,
          pairs: box.totalPairs,
          unitPrice,
          onHand,
        });
      }
    }
  }

  return <CartView inStockOptions={inStockOptions} inventory={inventory} />;
}
