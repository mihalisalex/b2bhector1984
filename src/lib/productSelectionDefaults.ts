import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import type { BoxTypeId, Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";

/** Plain data logic (no client-only APIs) shared between the product page (server —
 * seeds ColorwaySelectionProvider's initial value) and PrimaryPurchasePanel (client —
 * recomputes the default box type when the colorway selection changes). */
export function pickDefaultColorway(style: Style, inventory: StyleInventory): string {
  const inStock = style.colorways.find((c) => Object.values(inventory[c.id] ?? {}).some((n) => (n ?? 0) > 0));
  return (inStock ?? style.colorways[0]).id;
}

export function pickDefaultBoxType(style: Style, inventory: StyleInventory, colorwayId: string): BoxTypeId {
  const boxTypes = getAvailableBoxTypes(style);
  const inStock = boxTypes.find((b) => (inventory[colorwayId]?.[b.id] ?? 0) > 0);
  return (inStock ?? boxTypes[0]).id;
}
