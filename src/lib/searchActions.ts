"use server";

import { getAllStyles, getStyleImageUrl, searchStyleIds } from "@/lib/data/styles";
import { getUnitPrice } from "@/lib/pricing";
import { getCurrentAccount } from "@/lib/session";

export interface SearchResult {
  id: string;
  slug: string;
  name: string;
  styleNumber: string;
  category: string;
  imageUrl: string;
  price: number;
}

/** Instant-search for the header search overlay — SKU/name/category, ranked by Postgres
 * full-text search when available, falling back to a plain substring match.
 * Returns an empty list rather than throwing on a DB hiccup, matching this app's existing
 * degrade-gracefully pattern (see searchStyleIds) — the overlay shows "no matches" instead
 * of an unhandled error. */
export async function searchStylesAction(query: string): Promise<SearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const [styles, account, matchedIds] = await Promise.all([
      getAllStyles(),
      getCurrentAccount(),
      searchStyleIds(trimmed),
    ]);
    const priceMultiplier = account?.priceMultiplier ?? 1;
    const q = trimmed.toLowerCase();

    const matches = styles.filter(
      (s) =>
        matchedIds.has(s.id) ||
        s.name.toLowerCase().includes(q) ||
        s.styleNumber.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );

    return matches.slice(0, 8).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      styleNumber: s.styleNumber,
      category: s.category,
      imageUrl: getStyleImageUrl(s),
      price: getUnitPrice(s, "net60", priceMultiplier),
    }));
  } catch (err) {
    console.error(`searchStylesAction failed: ${err instanceof Error ? err.message : err}`);
    return [];
  }
}
