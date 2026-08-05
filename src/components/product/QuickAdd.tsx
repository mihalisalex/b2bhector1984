"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useCatalog } from "@/lib/catalog-context";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { formatEUR, getUnitPrice, MAX_BACKORDER_QTY } from "@/lib/pricing";
import { VatSuffix } from "@/components/ui/VatSuffix";
import { pickDefaultBoxType } from "@/lib/productSelectionDefaults";
import type { StyleInventory } from "@/lib/data/inventory";
import type { BoxTypeId, Style } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Add a box straight from a catalogue card — box size and quantity picked inline,
 * without a round trip through the product page. Wholesale buyers build orders across
 * many styles at once; making each one a two-page detour is the single biggest source
 * of friction in the catalogue.
 *
 * Colorway is owned by the card (`colorwayId`) — the card's own swatch row is the
 * single source of truth, so there's only ever one colour picker shown per card
 * instead of a duplicate one appearing here.
 *
 * Stock is real (passed down from the page's inventory fetch), so unavailable colorways
 * are disabled rather than failing on add.
 */
export function QuickAdd({
  style,
  inventory,
  priceMultiplier = 1,
  colorwayId,
}: {
  style: Style;
  inventory: StyleInventory;
  priceMultiplier?: number;
  colorwayId: string;
}) {
  const { addLines, lines } = useCart();
  const { productionLeadTimeDays } = useCatalog();
  const boxTypes = getAvailableBoxTypes(style);
  const allowBackorder = style.allowBackorder;

  const [open, setOpen] = useState(false);
  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() => pickDefaultBoxType(style, inventory, colorwayId));
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // The card's swatch row can change `colorwayId` out from under this panel — re-pick a
  // box type that's actually in stock for the newly selected colour. Adjusted during
  // render (React's documented pattern for state that must reset when a prop changes)
  // rather than in an effect, which would commit the stale box type for one extra frame.
  const [prevColorwayId, setPrevColorwayId] = useState(colorwayId);
  if (colorwayId !== prevColorwayId) {
    setPrevColorwayId(colorwayId);
    setBoxTypeId(pickDefaultBoxType(style, inventory, colorwayId));
    setQty(1);
    setJustAdded(false);
  }

  const onHand = inventory[colorwayId]?.[boxTypeId] ?? 0;
  const inCart =
    lines.find((l) => l.styleId === style.id && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId)?.qty ?? 0;
  const remaining = Math.max(0, onHand - inCart);
  const maxSelectable = allowBackorder ? MAX_BACKORDER_QTY : remaining;
  const willBeProduction = allowBackorder && inCart + qty > onHand;
  const box = boxTypes.find((b) => b.id === boxTypeId) ?? boxTypes[0];
  const unitPrice = getUnitPrice(style, "net60", priceMultiplier);
  const anyStock = Object.values(inventory).some((byBox) =>
    Object.values(byBox ?? {}).some((n) => (n ?? 0) > 0),
  );

  function add() {
    if (remaining <= 0 && !allowBackorder) return;
    addLines(style.id, [{ colorwayId, boxTypeId, qty: inCart + qty }]);
    setJustAdded(true);
    setQty(1);
    setTimeout(() => setJustAdded(false), 2000);
  }

  if (!anyStock && !allowBackorder) {
    return (
      <p className="mt-3 border-t border-stone-200 pt-3 text-[11px] font-medium text-ink-soft">
        Out of stock — check back or ask your rep
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 w-full border border-ink px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink transition-colors hover:bg-ink hover:text-white"
      >
        Quick add
      </button>
    );
  }

  return (
    <div className="mt-3 border-t border-stone-200 pt-3">
      {boxTypes.length > 1 && (
        <div className="mb-2 flex gap-1.5">
          {boxTypes.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setBoxTypeId(b.id);
                setQty(1);
              }}
              aria-pressed={b.id === boxTypeId}
              className={cn(
                "flex-1 border px-1.5 py-1 text-[11px] font-semibold transition-colors",
                b.id === boxTypeId ? "border-ink bg-signal-100/40 text-ink" : "border-stone-300 text-ink-soft hover:border-cinder-300",
              )}
            >
              {b.totalPairs}pr
            </button>
          ))}
        </div>
      )}

      <p className={cn("mb-2 text-[11px] font-medium", remaining > 0 && !willBeProduction ? "text-ink-soft" : "text-ember")}>
        {willBeProduction
          ? style.backorderMode === "pre_order"
            ? "Pre-order — ships upon arrangement"
            : `Made to order — ~${productionLeadTimeDays} days`
          : remaining > 0
            ? `${remaining} box${remaining === 1 ? "" : "es"} available`
            : "None left in this combination"}
        {inCart > 0 && <span className="text-ink-soft"> · {inCart} in cart</span>}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex items-center border border-stone-300">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="flex h-9 w-8 items-center justify-center text-ink hover:bg-stone-100 disabled:opacity-30"
          >
            −
          </button>
          <span className="font-mono-tab flex h-9 w-8 items-center justify-center text-sm font-semibold text-ink">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxSelectable, q + 1))}
            disabled={qty >= maxSelectable}
            aria-label="Increase quantity"
            className="flex h-9 w-8 items-center justify-center text-ink hover:bg-stone-100 disabled:opacity-30"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={remaining <= 0 && !allowBackorder}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 bg-ink px-2 py-2 leading-none text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-cinder-300"
        >
          <span className="text-xs font-semibold uppercase tracking-wide">{justAdded ? "Added ✓" : "Add"}</span>
          {!justAdded && (
            <span className="font-mono-tab text-[11px] tabular-nums text-white/75">
              {formatEUR(unitPrice * box.totalPairs * qty)}
              <VatSuffix vatRate={style.vatRate} className="text-white/60" />
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
