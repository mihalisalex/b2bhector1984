"use client";

import { useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { getAvailableBoxTypes, getSizeBreakdown, getTotalPairs } from "@/lib/data/boxTypes";
import { formatEUR, validateMatrix } from "@/lib/pricing";
import type { StyleInventory } from "@/lib/data/inventory";
import type { BoxTypeId, Style } from "@/lib/types";
import { cn } from "@/lib/cn";

type BoxQtyMap = Record<string, Partial<Record<BoxTypeId, number>>>;

function buildInitialQty(
  style: Style,
  boxTypes: { id: BoxTypeId }[],
  cartLines: { styleId: string; colorwayId: string; boxTypeId: BoxTypeId; qty: number }[],
): BoxQtyMap {
  const map: BoxQtyMap = {};
  for (const colorway of style.colorways) {
    map[colorway.id] = {};
    for (const box of boxTypes) {
      const line = cartLines.find(
        (l) => l.styleId === style.id && l.colorwayId === colorway.id && l.boxTypeId === box.id,
      );
      map[colorway.id][box.id] = line?.qty ?? 0;
    }
  }
  return map;
}

export function MatrixOrderGrid({ style, inventory }: { style: Style; inventory: StyleInventory }) {
  const { addLines, lines } = useCart();
  const boxTypes = getAvailableBoxTypes(style);
  const [qty, setQty] = useState<BoxQtyMap>(() => buildInitialQty(style, boxTypes, lines));
  const [confirmed, setConfirmed] = useState(false);

  const validation = useMemo(() => validateMatrix(style, qty), [style, qty]);

  function setCell(colorwayId: string, boxTypeId: BoxTypeId, value: number) {
    setConfirmed(false);
    const onHand = inventory[colorwayId]?.[boxTypeId] ?? 0;
    setQty((prev) => ({
      ...prev,
      [colorwayId]: { ...prev[colorwayId], [boxTypeId]: Math.min(onHand, Math.max(0, Math.floor(value) || 0)) },
    }));
  }

  function step(colorwayId: string, boxTypeId: BoxTypeId, delta: number) {
    const current = qty[colorwayId]?.[boxTypeId] ?? 0;
    setCell(colorwayId, boxTypeId, current + delta);
  }

  function handleReset() {
    setQty(buildInitialQty(style, boxTypes, []));
    setConfirmed(false);
  }

  function handleAddToCart() {
    if (validation.totalBoxes === 0) return;
    const entries = style.colorways.flatMap((c) =>
      boxTypes.map((box) => ({ colorwayId: c.id, boxTypeId: box.id, qty: qty[c.id]?.[box.id] ?? 0 })),
    );
    addLines(style.id, entries);
    setConfirmed(true);
  }

  const canAdd = validation.totalBoxes > 0;

  return (
    <div className="border border-stone-300 bg-white">
      {/* Price strip */}
      <div className="flex flex-wrap items-stretch divide-x divide-stone-300 border-b border-stone-300 bg-stone-100">
        <div className="flex flex-1 min-w-[160px] flex-col px-4 py-2.5">
          <span className="font-mono-tab text-[11px] uppercase tracking-wide text-ink-soft">Wholesale price</span>
          <span className="font-mono-tab text-base font-semibold tabular-nums text-ink">{formatEUR(validation.unitPrice)}</span>
        </div>
        <div className="flex flex-1 min-w-[220px] flex-col justify-center px-4 py-2.5 text-ink-soft">
          <span className="text-xs">Pay in full for 10% off, net-30 for 5% off — set at checkout.</span>
        </div>
      </div>

      {/* Box legend */}
      <div className="grid grid-cols-1 gap-px border-b border-stone-300 bg-stone-300 sm:grid-cols-3">
        {boxTypes.map((box) => (
          <div key={box.id} className="flex items-center justify-between gap-3 bg-stone-50 px-4 py-2.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink">{box.label}</span>
            <span className="font-mono-tab text-[11px] text-ink-soft">
              {Object.entries(box.sizeBreakdown).map(([sz, ct]) => `${sz}×${ct}`).join(" ")}
            </span>
          </div>
        ))}
      </div>

      {/* Colorway box-quantity cards */}
      <div className="divide-y divide-stone-200">
        {style.colorways.map((colorway) => {
          const rowBoxes = qty[colorway.id] ?? {};
          const rowPairs = getTotalPairs(rowBoxes);
          const breakdown = getSizeBreakdown(rowBoxes);
          const activeSizes = Object.entries(breakdown).filter(([, ct]) => ct > 0);

          return (
            <div key={colorway.id} className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-12 overflow-hidden border border-stone-300" aria-hidden>
                    <span className="h-full w-1/2" style={{ background: colorway.swatch[0] }} />
                    <span className="h-full w-1/2" style={{ background: colorway.swatch[1] ?? colorway.swatch[0] }} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold leading-tight text-ink">{colorway.name}</p>
                    <p className="font-mono-tab text-[11px] leading-tight text-ink-soft">
                      {style.styleNumber}-{colorway.skuSuffix}
                    </p>
                  </div>
                </div>
                {rowPairs > 0 && (
                  <div className="font-mono-tab text-xs text-ink-soft">
                    {activeSizes.map(([sz, ct]) => `${sz}×${ct}`).join(" · ")}
                    <span className="ml-2 font-semibold text-ink">{rowPairs} pairs</span>
                  </div>
                )}
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {boxTypes.map((box) => {
                  const boxQty = rowBoxes[box.id] ?? 0;
                  const onHand = inventory[colorway.id]?.[box.id] ?? 0;
                  const outOfStock = onHand === 0;
                  const lowStock = onHand > 0 && onHand <= 4;
                  return (
                    <div
                      key={box.id}
                      className={cn(
                        "flex flex-col gap-2 border px-3 py-3 transition-colors",
                        outOfStock ? "border-stone-300 opacity-60" : boxQty > 0 ? "border-ink bg-signal-100/40" : "border-stone-300",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                          {box.label}
                        </span>
                        <span className={cn("font-mono-tab text-[10px]", outOfStock ? "text-ember" : lowStock ? "text-ember" : "text-ink-soft")}>
                          {outOfStock ? "Out of stock" : `${onHand} avail.`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          aria-label={`Decrease ${box.label} quantity for ${colorway.name}`}
                          onClick={() => step(colorway.id, box.id, -1)}
                          className="flex h-8 w-8 items-center justify-center border border-stone-300 text-ink hover:border-ink disabled:opacity-30"
                          disabled={boxQty === 0}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          max={onHand}
                          inputMode="numeric"
                          value={boxQty || ""}
                          placeholder="0"
                          disabled={outOfStock}
                          aria-label={`${box.label} quantity for ${colorway.name}`}
                          onChange={(e) => setCell(colorway.id, box.id, Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          className="font-mono-tab w-12 border-0 bg-transparent text-center text-lg font-semibold tabular-nums text-ink outline-none disabled:cursor-not-allowed"
                        />
                        <button
                          type="button"
                          aria-label={`Increase ${box.label} quantity for ${colorway.name}`}
                          onClick={() => step(colorway.id, box.id, 1)}
                          className="flex h-8 w-8 items-center justify-center border border-stone-300 text-ink hover:border-ink disabled:opacity-30"
                          disabled={boxQty >= onHand}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary / action bar */}
      <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-stone-300 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5">
          <Stat label="Boxes" value={String(validation.totalBoxes)} />
          <Stat label="Pairs" value={String(validation.totalPairs)} />
          <Stat label="Unit price" value={formatEUR(validation.unitPrice)} />
          <Stat label="Subtotal" value={formatEUR(validation.subtotal)} emphasize />
        </div>
        <div className="flex items-center gap-3">
          {confirmed && <p className="text-xs font-medium text-positive">Added to cart.</p>}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium uppercase tracking-wide text-ink-soft hover:text-ink"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-cinder-300 disabled:text-white/70"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      <span
        className={cn(
          "font-mono-tab tabular-nums",
          emphasize ? "text-lg font-bold text-ink" : "text-sm font-medium text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
