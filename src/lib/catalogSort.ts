import { getBoxType } from "@/lib/data/boxTypes";
import { getEffectiveBasePrice } from "@/lib/pricing";
import type { Style } from "@/lib/types";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "best_selling", label: "Best Selling" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "alphabetical", label: "Alphabetical" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export function isSortKey(value: string): value is SortKey {
  return SORT_OPTIONS.some((o) => o.value === value);
}

/** styleId -> lifetime pairs sold, derived from raw order_lines rows (style_id/box_type_id/qty). */
export function pairsSoldByStyle(orderLines: { style_id: string; box_type_id: string; qty: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of orderLines) {
    const pairs = row.qty * getBoxType(row.box_type_id as never).totalPairs;
    map.set(row.style_id, (map.get(row.style_id) ?? 0) + pairs);
  }
  return map;
}

export function sortStyles(styles: Style[], sort: SortKey, pairsSold?: Map<string, number>): Style[] {
  const sorted = [...styles];
  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    case "best_selling":
      return sorted.sort((a, b) => (pairsSold?.get(b.id) ?? 0) - (pairsSold?.get(a.id) ?? 0));
    case "price_asc":
      return sorted.sort((a, b) => getEffectiveBasePrice(a) - getEffectiveBasePrice(b));
    case "price_desc":
      return sorted.sort((a, b) => getEffectiveBasePrice(b) - getEffectiveBasePrice(a));
    case "alphabetical":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "newest":
    default:
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
