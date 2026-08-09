"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useCancelableTimeout } from "@/lib/useCancelableTimeout";
import { textActionClassNames } from "@/components/ui/TextAction";
import type { BoxTypeId, SavedAssortmentLine } from "@/lib/types";

/** Only lines saved after migration 0021 carry colorway/box detail — older
 * assortments (style ids only) can't be loaded directly, just browsed below. */
export function LoadAssortmentButton({ lines, className }: { lines: SavedAssortmentLine[]; className?: string }) {
  const { addLines, lines: cartLines } = useCart();
  const router = useRouter();
  const [done, setDone] = useState(false);
  const scheduleRedirect = useCancelableTimeout();

  const loadable = lines.filter((l) => l.colorwayId && l.boxTypeId);
  if (loadable.length === 0) return null;

  function handleLoad() {
    const byStyle = new Map<string, { colorwayId: string; boxTypeId: BoxTypeId; qty: number }[]>();
    for (const line of loadable) {
      const colorwayId = line.colorwayId!;
      const boxTypeId = line.boxTypeId!;
      if (!byStyle.has(line.styleId)) byStyle.set(line.styleId, []);
      // Add to whatever's already in the cart for this exact colorway/box
      // rather than overwriting it — same merge behavior as Reorder.
      const existingQty = cartLines.find(
        (l) => l.styleId === line.styleId && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId,
      )?.qty ?? 0;
      byStyle.get(line.styleId)!.push({ colorwayId, boxTypeId, qty: existingQty + line.qty });
    }
    for (const [styleId, entries] of byStyle.entries()) addLines(styleId, entries);
    setDone(true);
    scheduleRedirect(() => router.push("/cart"), 350);
  }

  return (
    <button
      type="button"
      onClick={handleLoad}
      className={className ?? textActionClassNames("accent")}
    >
      {done ? "Added — opening cart…" : "Load into cart"}
    </button>
  );
}
