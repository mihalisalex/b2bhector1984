"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { textActionClassNames } from "@/components/ui/TextAction";
import type { BoxTypeId, Order } from "@/lib/types";

export function ReorderButton({ order, className }: { order: Order; className?: string }) {
  const { addLines, lines } = useCart();
  const router = useRouter();
  const [done, setDone] = useState(false);

  function handleReorder() {
    const byStyle = new Map<string, { colorwayId: string; boxTypeId: BoxTypeId; qty: number }[]>();
    for (const line of order.lines) {
      if (!byStyle.has(line.styleId)) byStyle.set(line.styleId, []);
      // Add to whatever's already in the cart for this exact colorway/box
      // rather than overwriting it — addLines sets an absolute quantity, so a
      // buyer who already has some of this combo in their cart from browsing
      // would otherwise have it silently replaced by the reorder's quantity.
      const existingQty = lines.find(
        (l) => l.styleId === line.styleId && l.colorwayId === line.colorwayId && l.boxTypeId === line.boxTypeId,
      )?.qty ?? 0;
      byStyle.get(line.styleId)!.push({ colorwayId: line.colorwayId, boxTypeId: line.boxTypeId, qty: existingQty + line.qty });
    }
    for (const [styleId, entries] of byStyle.entries()) addLines(styleId, entries);
    setDone(true);
    setTimeout(() => router.push("/cart"), 350);
  }

  return (
    <button
      type="button"
      onClick={handleReorder}
      className={className ?? textActionClassNames("accent")}
    >
      {done ? "Added — opening cart…" : "Reorder"}
    </button>
  );
}
