import type { BoxTypeId, Colorway } from "@/lib/types";

/**
 * One really-orderable box: a specific style x colorway x box size that has stock
 * on hand right now. Built server-side (inventory is server-only) and handed to the
 * cart so "complete your minimum" can never suggest something that isn't there.
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
}

/**
 * Pick boxes that best close a `shortfallPairs` gap to the order minimum.
 *
 * Ordering intent: anything that actually clears the minimum beats anything that
 * doesn't; among those, the smallest overshoot wins (don't push a buyer into 20
 * surplus pairs when 2 would do); among boxes that fall short, the biggest box
 * wins because it makes the most progress per click. Ties break on cheaper first.
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
