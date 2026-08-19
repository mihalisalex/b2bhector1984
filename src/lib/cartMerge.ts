import type { BoxTypeId } from "@/lib/types";

export interface MergeableCartLine {
  styleId: string;
  colorwayId: string;
  boxTypeId: BoxTypeId;
  qty: number;
}

/** A cart line's natural identity — the same tuple as `cart_lines`' primary key. */
function lineKey(line: MergeableCartLine): string {
  return `${line.styleId}::${line.colorwayId}::${line.boxTypeId}`;
}

/**
 * Unions two carts, taking the **higher** quantity when the same line appears in both.
 *
 * The business rule the owner chose is "union": a buyer who put boxes in a cart on their
 * laptop and different boxes on their phone should find both. The only ambiguous case is one
 * line present on both devices with different counts, and the choice there is between summing
 * and taking the maximum.
 *
 * It takes the maximum, because **summing is not idempotent**. The same cart reconciles on
 * every page load, every sign-in and every device; if identical states summed, a buyer who
 * simply opened the site twice would watch their order double. With `max`, merging a cart
 * with itself is a no-op, merging in any order gives the same answer, and no quantity a buyer
 * deliberately set is ever lost — the larger number always survives.
 *
 * The cost is real and worth stating: a buyer who genuinely wants 2 boxes on one device *plus*
 * 3 on another gets 3, not 5. That is the safer error. Under-counting is visible in the cart
 * and one tap from being fixed; silently over-counting a 40-pair minimum order is not.
 *
 * Deleting is handled by `saveCart` replacing the stored set outright, not here — this
 * function only ever runs when reconciling two live carts on load.
 */
export function mergeCarts(a: MergeableCartLine[], b: MergeableCartLine[]): MergeableCartLine[] {
  const merged = new Map<string, MergeableCartLine>();
  for (const line of [...a, ...b]) {
    if (line.qty <= 0) continue;
    const key = lineKey(line);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...line });
    } else if (line.qty > existing.qty) {
      existing.qty = line.qty;
    }
  }
  return [...merged.values()];
}

/** True when the two carts describe the same set of lines at the same quantities. Used to
 * skip a pointless server write when reconciliation changed nothing — the common case. */
export function cartsEqual(a: MergeableCartLine[], b: MergeableCartLine[]): boolean {
  if (a.length !== b.length) return false;
  const byKey = new Map(a.map((line) => [lineKey(line), line.qty]));
  return b.every((line) => byKey.get(lineKey(line)) === line.qty);
}
