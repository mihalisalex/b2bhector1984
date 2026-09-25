"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { t } from "@/i18n/format";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getUnitPrice, MAX_BACKORDER_QTY } from "@/lib/pricing";
import { useFormat, useI18n } from "@/i18n/I18nProvider";
import { pickDefaultBoxType } from "@/lib/productSelectionDefaults";
import type { StyleInventory } from "@/lib/data/inventory";
import type { BoxTypeId, Style } from "@/lib/types";
import { StepIcon } from "@/components/ui/StepIcon";
import { useCancelableTimeout } from "@/lib/useCancelableTimeout";
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
  const { eur } = useFormat();
  const c = useI18n().dict.catalog;
  const { addLines, lines, terms } = useCart();
  const boxTypes = getAvailableBoxTypes(style);
  const allowBackorder = style.allowBackorder;

  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() => pickDefaultBoxType(style, inventory, colorwayId));
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const scheduleReset = useCancelableTimeout();

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
  const unitPrice = getUnitPrice(style, terms, priceMultiplier);
  const anyStock = Object.values(inventory).some((byBox) =>
    Object.values(byBox ?? {}).some((n) => (n ?? 0) > 0),
  );

  function add() {
    if (remaining <= 0 && !allowBackorder) return;
    addLines(style.id, [{ colorwayId, boxTypeId, qty: inCart + qty }]);
    setJustAdded(true);
    setQty(1);
    scheduleReset(() => setJustAdded(false), 2000);
  }

  if (!anyStock && !allowBackorder) {
    return (
      <p className="text-[11px] font-medium text-ink-soft">{c.outOfStockAsk}</p>
    );
  }

  // Always open. It used to sit behind a "Quick add" button, which made adding a box
  // from the catalogue a three-tap job; the card now carries price and delivery itself,
  // so the only thing left here is how many boxes.
  return (
    <div>
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
                // EXPERIMENTAL rounded-full, 2026-08-10 — see Button.tsx's `base` comment for the revert path.
                "flex-1 rounded-full border px-1.5 py-1 text-[11px] font-semibold transition-colors",
                b.id === boxTypeId ? "border-ink bg-signal-100/40 text-ink" : "border-stone-300 text-ink-soft hover:border-cinder-300",
              )}
            >
              {b.totalPairs}pr
            </button>
          ))}
        </div>
      )}

      {/* Delivery is on the card itself; this line only appears when there is something
          box-specific to say — real stock on the shelf, or boxes already in the cart. */}
      {(inCart > 0 || (!willBeProduction && onHand > 0) || (!allowBackorder && remaining <= 0)) && (
        <p className="mb-2 text-[11px] font-medium text-ink-soft">
          {!allowBackorder && remaining <= 0
            ? c.noneLeftCombo
            : !willBeProduction && onHand > 0
              ? t(c.boxesAvailable, { count: remaining })
              : null}
          {inCart > 0 && (
            <span>
              {!willBeProduction && onHand > 0 ? " · " : ""}
              {t(c.inCartCount, { count: inCart })}
            </span>
          )}
        </p>
      )}

      {/* EXPERIMENTAL rounded-full, 2026-08-10 — see Button.tsx's `base` comment for the
          revert path. The stepper's `overflow-hidden` is what caps its square inner buttons
          into a pill shape, rather than rounding each one individually. */}
      <div className="flex items-center gap-2">
        <div className="flex items-center overflow-hidden rounded-full border border-stone-300">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label={c.decreaseQty}
            className="flex h-9 w-8 items-center justify-center text-ink hover:bg-stone-100 disabled:opacity-30"
          >
            <StepIcon kind="minus" />
          </button>
          <span className="font-mono-tab flex h-9 w-8 items-center justify-center text-sm font-semibold text-ink">
            {qty}
          </span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxSelectable, q + 1))}
            disabled={qty >= maxSelectable}
            aria-label={c.increaseQty}
            className="flex h-9 w-8 items-center justify-center text-ink hover:bg-stone-100 disabled:opacity-30"
          >
            <StepIcon kind="plus" />
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={remaining <= 0 && !allowBackorder}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-full bg-ink px-2 py-2 leading-none text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-cinder-300"
        >
          <span className="text-xs font-semibold uppercase tracking-wide tabular-nums">
            {justAdded ? c.quickAdded : t(c.addBoxShort, { total: eur(unitPrice * box.totalPairs * qty) })}
          </span>
        </button>
      </div>
    </div>
  );
}
