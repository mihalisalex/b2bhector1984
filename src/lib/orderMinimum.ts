import type { BoxTypeId, Colorway } from "@/lib/types";

/** How a suggested box would actually be fulfilled if the buyer added it right now. */
export type BoxFulfillment = "stock" | "made_to_order" | "pre_order";

/**
 * One really-orderable box: a specific style x colorway x box size the buyer can
 * genuinely add right now. Built server-side (inventory is server-only) and handed to
 * the cart so "complete your minimum" can never suggest something that isn't there.
 *
 * "Orderable" deliberately includes boxes with zero on-hand whose style allows
 * backorders — that is the whole point of production-upon-request, and while the
 * catalogue sits at zero stock it is the *only* way this feature has anything to
 * suggest. `fulfillment` is what keeps that honest: the UI labels a made-to-order or
 * pre-order box as such instead of implying it ships off the shelf.
 */
export interface BoxOption {
  styleId: string;
  styleName: string;
  slug: string;
  styleNumber: string;
  imageUrl: string;
  colorwayId: string;
  colorwayName: string;
  swatch: Colorway["swatch"];
  boxTypeId: BoxTypeId;
  boxLabel: string;
  pairs: number;
  /** Per-pair net-60 price, already adjusted for the account's multiplier. */
  unitPrice: number;
  onHand: number;
  /** `"stock"` ships off the shelf; the other two go into production. Drives both the
   * label on the suggestion card and whether `onHand` is treated as a ceiling. */
  fulfillment: BoxFulfillment;
}

/**
 * Pick boxes that best close a `shortfallPairs` gap to the order minimum.
 *
 * Ordering intent: anything that actually clears the minimum beats anything that
 * doesn't; among those, the smallest overshoot wins (don't push a buyer into 20
 * surplus pairs when 2 would do); among boxes that fall short, the biggest box
 * wins because it makes the most progress per click. Then anything shipping from
 * stock is preferred over anything that has to be produced — equally good at closing
 * the gap, but the buyer gets it sooner. Ties break on cheaper first.
 *
 * Capped to one suggestion per style so the list reads as a spread of the range
 * rather than four colorways of the same shoe.
 */
export function suggestBoxesToCloseGap(
  options: BoxOption[],
  shortfallPairs: number,
  limit = 4,
): BoxOption[] {
  if (shortfallPairs <= 0) return [];

  const ranked = [...options].sort((a, b) => {
    const aOver = a.pairs - shortfallPairs;
    const bOver = b.pairs - shortfallPairs;
    const aCloses = aOver >= 0;
    const bCloses = bOver >= 0;
    if (aCloses !== bCloses) return aCloses ? -1 : 1;
    if (aCloses) {
      if (aOver !== bOver) return aOver - bOver;
    } else if (a.pairs !== b.pairs) {
      return b.pairs - a.pairs;
    }
    const aFromStock = a.fulfillment === "stock";
    const bFromStock = b.fulfillment === "stock";
    if (aFromStock !== bFromStock) return aFromStock ? -1 : 1;
    return a.pairs * a.unitPrice - b.pairs * b.unitPrice;
  });

  const picked: BoxOption[] = [];
  const seenStyles = new Set<string>();
  for (const option of ranked) {
    if (seenStyles.has(option.styleId)) continue;
    seenStyles.add(option.styleId);
    picked.push(option);
    if (picked.length >= limit) break;
  }
  return picked;
}
