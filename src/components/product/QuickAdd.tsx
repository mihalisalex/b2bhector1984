"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { formatEUR, getUnitPrice } from "@/lib/pricing";
import { pickDefaultBoxType, pickDefaultColorway } from "@/lib/productSelectionDefaults";
import type { StyleInventory } from "@/lib/data/inventory";
import type { BoxTypeId, Style } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * Add a box straight from a catalogue card — colorway, box size and quantity picked
 * inline, without a round trip through the product page. Wholesale buyers build orders
 * across many styles at once; making each one a two-page detour is the single biggest
 * source of friction in the catalogue.
 *
 * Stock is real (passed down from the page's inventory fetch), so unavailable colorways
 * are disabled rather than failing on add.
 */
export function QuickAdd({
  style,
  inventory,
  priceMultiplier = 1,
}: {
  style: Style;
  inventory: StyleInventory;
  priceMultiplier?: number;
}) {
  const { addLines, lines } = useCart();
  const boxTypes = getAvailableBoxTypes(style);

  const [open, setOpen] = useState(false);
  const [colorwayId, setColorwayId] = useState(() => pickDefaultColorway(style, inventory));
  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() =>
    pickDefaultBoxType(style, inventory, pickDefaultColorway(style, inventory)),
  );
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const onHand = inventory[colorwayId]?.[boxTypeId] ?? 0;
  const inCart =
    lines.find((l) => l.styleId === style.id && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId)?.qty ?? 0;
  const remaining = Math.max(0, onHand - inCart);
  const box = boxTypes.find((b) => b.id === boxTypeId) ?? boxTypes[0];
  const unitPrice = getUnitPrice(style, "net60", priceMultiplier);
  const anyStock = Object.values(inventory).some((byBox) =>
    Object.values(byBox ?? {}).some((n) => (n ?? 0) > 0),
  );

  function selectColorway(id: string) {
    setColorwayId(id);
    setBoxTypeId(pickDefaultBoxType(style, inventory, id));
    setQty(1);
    setJustAdded(false);
  }

  function add() {
    if (remaining <= 0) return;
    addLines(style.id, [{ colorwayId, boxTypeId, qty: inCart + qty }]);
    setJustAdded(true);
    setQty(1);
    setTimeout(() => setJustAdded(false), 2000);
  }

  if (!anyStock) {
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
      {style.colorways.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {style.colorways.map((c) => {
            const stocked = Object.values(inventory[c.id] ?? {}).some((n) => (n ?? 0) > 0);
            const selected = c.id === colorwayId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectColorway(c.id)}
                disabled={!stocked}
                title={stocked ? c.name : `${c.name} — out of stock`}
                aria-label={stocked ? c.name : `${c.name}, out of stock`}
                aria-pressed={selected}
                className={cn(
                  "flex h-7 w-7 overflow-hidden rounded-full ring-offset-1 transition-all",
                  selected ? "ring-2 ring-ink" : "ring-1 ring-stone-300 hover:ring-cinder-300",
                  !stocked && "cursor-not-allowed opacity-30",
                )}
              >
                <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
              </button>
            );
          })}
        </div>
      )}

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

      <p className={cn("mb-2 text-[11px] font-medium", remaining > 0 ? "text-ink-soft" : "text-ember")}>
        {remaining > 0 ? `${remaining} box${remaining === 1 ? "" : "es"} available` : "None left in this combination"}
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
            onClick={() => setQty((q) => Math.min(remaining, q + 1))}
            disabled={qty >= remaining}
            aria-label="Increase quantity"
            className="flex h-9 w-8 items-center justify-center text-ink hover:bg-stone-100 disabled:opacity-30"
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={remaining <= 0}
          className="flex-1 bg-ink px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-cinder-300"
        >
          {justAdded ? "Added ✓" : `Add · ${formatEUR(unitPrice * box.totalPairs * qty)}`}
        </button>
      </div>
    </div>
  );
}
