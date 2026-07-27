import type { BoxType, BoxTypeId } from "@/lib/types";

/**
 * Every style ships in the same three pre-pack box configurations — wholesale
 * is sold by the box, never by the single pair. Each larger box is a strict
 * superset of the smaller one:
 *   8-pair:  40x1 41x2 42x2 43x2 44x1
 *   10-pair: 8-pair + 44x1 45x1
 *   12-pair: 10-pair + 42x1 43x1
 */
export const EU_SIZES = ["40", "41", "42", "43", "44", "45"];

export const BOX_TYPES: BoxType[] = [
  {
    id: "box8",
    label: "8-Pair Box",
    totalPairs: 8,
    sizeBreakdown: { "40": 1, "41": 2, "42": 2, "43": 2, "44": 1 },
  },
  {
    id: "box10",
    label: "10-Pair Box",
    totalPairs: 10,
    sizeBreakdown: { "40": 1, "41": 2, "42": 2, "43": 2, "44": 2, "45": 1 },
  },
  {
    id: "box12",
    label: "12-Pair Box",
    totalPairs: 12,
    sizeBreakdown: { "40": 1, "41": 2, "42": 3, "43": 3, "44": 2, "45": 1 },
  },
];

export function getBoxType(id: BoxTypeId): BoxType {
  const box = BOX_TYPES.find((b) => b.id === id);
  if (!box) throw new Error(`Unknown box type: ${id}`);
  return box;
}

/** Combined per-size pair count across a set of {boxTypeId: qty}. */
export function getSizeBreakdown(boxQty: Partial<Record<BoxTypeId, number>>): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(EU_SIZES.map((s) => [s, 0]));
  for (const box of BOX_TYPES) {
    const qty = boxQty[box.id] ?? 0;
    if (!qty) continue;
    for (const [size, count] of Object.entries(box.sizeBreakdown)) {
      totals[size] = (totals[size] ?? 0) + count * qty;
    }
  }
  return totals;
}

export function getTotalPairs(boxQty: Partial<Record<BoxTypeId, number>>): number {
  return BOX_TYPES.reduce((sum, box) => sum + (boxQty[box.id] ?? 0) * box.totalPairs, 0);
}

export function getTotalBoxes(boxQty: Partial<Record<BoxTypeId, number>>): number {
  return BOX_TYPES.reduce((sum, box) => sum + (boxQty[box.id] ?? 0), 0);
}
