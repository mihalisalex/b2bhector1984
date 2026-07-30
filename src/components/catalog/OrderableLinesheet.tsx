"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart, type CartLine } from "@/lib/cart-context";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { formatEUR, getUnitPrice, isOnSale, validateMatrix } from "@/lib/pricing";
import { CATEGORY_LABEL, GENDER_LABEL, getStyleImageUrl } from "@/lib/data/styleLabels";
import type { StyleInventory } from "@/lib/data/inventory";
import type { BoxTypeId, Style } from "@/lib/types";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { cn } from "@/lib/cn";

/** colorwayId -> boxTypeId -> qty (boxes) */
type StyleQtyMap = Record<string, Partial<Record<BoxTypeId, number>>>;
/** styleId -> StyleQtyMap */
type AllQtyMap = Record<string, StyleQtyMap>;

function buildInitialQtyForStyle(style: Style, cartLines: CartLine[]): StyleQtyMap {
  const map: StyleQtyMap = {};
  for (const colorway of style.colorways) map[colorway.id] = {};
  for (const line of cartLines) {
    if (line.styleId !== style.id) continue;
    map[line.colorwayId] = map[line.colorwayId] || {};
    map[line.colorwayId]![line.boxTypeId] = line.qty;
  }
  return map;
}

export function OrderableLinesheet({
  styles,
  inventory,
  priceMultiplier = 1,
}: {
  styles: Style[];
  inventory: Record<string, StyleInventory>;
  priceMultiplier?: number;
}) {
  const { lines, addLines } = useCart();
  const [qty, setQty] = useState<AllQtyMap>(() => {
    const map: AllQtyMap = {};
    for (const style of styles) map[style.id] = buildInitialQtyForStyle(style, lines);
    return map;
  });
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  function cellKey(styleId: string, colorwayId: string, boxTypeId: BoxTypeId) {
    return `${styleId}:${colorwayId}:${boxTypeId}`;
  }

  // Seed state for any style that enters the view after a filter change,
  // without touching in-progress edits on styles already present.
  useEffect(() => {
    // Syncing new styles into local qty state when the filtered list changes,
    // without resetting in-progress edits on styles already present.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQty((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const style of styles) {
        if (!next[style.id]) {
          next[style.id] = buildInitialQtyForStyle(style, lines);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // Intentionally excludes `lines`: this effect should only re-seed on a
    // styles/filter change, not re-run every time cart lines change elsewhere.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styles]);

  // Keep every untouched cell in sync with the live cart — covers the cart's
  // own hydrate-from-localStorage completing after this component's initial
  // mount/seed, and any other cart change (e.g. the product page) made while
  // this table stays mounted. Cells the user has actually edited (`dirty`)
  // keep their in-progress value.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQty((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const style of styles) {
        const seeded = buildInitialQtyForStyle(style, lines);
        for (const colorway of style.colorways) {
          for (const box of getAvailableBoxTypes(style)) {
            const key = cellKey(style.id, colorway.id, box.id);
            if (dirty.has(key)) continue;
            const seededVal = seeded[colorway.id]?.[box.id] ?? 0;
            if ((prev[style.id]?.[colorway.id]?.[box.id] ?? 0) !== seededVal) {
              next[style.id] = { ...next[style.id], [colorway.id]: { ...next[style.id]?.[colorway.id], [box.id]: seededVal } };
              changed = true;
            }
          }
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, styles]);

  function setCell(styleId: string, colorwayId: string, boxTypeId: BoxTypeId, value: number) {
    setConfirmed(false);
    const onHand = inventory[styleId]?.[colorwayId]?.[boxTypeId] ?? 0;
    setQty((prev) => ({
      ...prev,
      [styleId]: {
        ...prev[styleId],
        [colorwayId]: { ...prev[styleId]?.[colorwayId], [boxTypeId]: Math.min(onHand, Math.max(0, Math.floor(value) || 0)) },
      },
    }));
    setDirty((prev) => new Set(prev).add(cellKey(styleId, colorwayId, boxTypeId)));
  }

  function step(styleId: string, colorwayId: string, boxTypeId: BoxTypeId, delta: number) {
    const current = qty[styleId]?.[colorwayId]?.[boxTypeId] ?? 0;
    setCell(styleId, colorwayId, boxTypeId, current + delta);
  }

  const validations = useMemo(
    () =>
      styles
        .map((style) => ({ style, ...validateMatrix(style, qty[style.id] ?? {}, "net60", priceMultiplier) }))
        .filter((v) => v.totalBoxes > 0),
    [styles, qty, priceMultiplier],
  );

  const grandTotal = validations.reduce((sum, v) => sum + v.subtotal, 0);

  function handleAddAllToCart() {
    if (validations.length === 0) return;
    for (const style of styles) {
      const styleQty = qty[style.id];
      if (!styleQty) continue;
      // Untouched cells submit whatever's *currently* in the cart (not this
      // table's local snapshot) so adding from here can never silently wipe
      // out a line added elsewhere for a colorway/box this table's user
      // never actually edited.
      const entries = style.colorways.flatMap((c) =>
        getAvailableBoxTypes(style).map((box) => {
          if (dirty.has(cellKey(style.id, c.id, box.id))) {
            return { colorwayId: c.id, boxTypeId: box.id, qty: styleQty[c.id]?.[box.id] ?? 0 };
          }
          const liveQty = lines.find(
            (l) => l.styleId === style.id && l.colorwayId === c.id && l.boxTypeId === box.id,
          )?.qty ?? 0;
          return { colorwayId: c.id, boxTypeId: box.id, qty: liveQty };
        }),
      );
      if (entries.some((e) => e.qty > 0)) addLines(style.id, entries);
    }
    setConfirmed(true);
  }

  return (
    <div>
      {/* Mobile / tablet: one card per style, steppers wrap instead of requiring horizontal scroll. */}
      <div className="flex flex-col gap-3 lg:hidden">
        {styles.map((style) => {
          const boxTypes = getAvailableBoxTypes(style);
          return (
            <div key={style.id} className="border border-stone-300 bg-white">
              <div className="flex items-center gap-3 border-b border-stone-200 p-3">
                <StylePlate
                  swatch={style.colorways[0].swatch}
                  imageUrl={getStyleImageUrl(style)}
                  alt={style.name}
                  className="h-16 w-20 shrink-0"
                  dense
                />
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${style.slug}`} className="font-medium text-ink hover:underline">
                    {style.name}
                  </Link>
                  <p className="font-mono-tab text-[11px] text-ink-soft">
                    {style.styleNumber} · {GENDER_LABEL[style.gender]} · {CATEGORY_LABEL[style.category]}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <AvailabilityBadge availability={style.availability} shipWindow={style.shipWindow} />
                    <span className="text-sm font-semibold tabular-nums text-ink">
                      {formatEUR(getUnitPrice(style, "net60", priceMultiplier))}
                    </span>
                    {isOnSale(style) && (
                      <span className="bg-ember px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">Sale</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-stone-200">
                {style.colorways.map((colorway) => (
                  <div key={colorway.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-4 w-6 shrink-0 overflow-hidden border border-stone-300" aria-hidden>
                        <span className="h-full w-1/2" style={{ background: colorway.swatch[0] }} />
                        <span className="h-full w-1/2" style={{ background: colorway.swatch[1] ?? colorway.swatch[0] }} />
                      </span>
                      <span className="text-sm text-ink-soft">{colorway.name}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {boxTypes.map((box) => (
                        <div key={box.id} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{box.label}</span>
                          <Stepper
                            value={qty[style.id]?.[colorway.id]?.[box.id] ?? 0}
                            onChange={(v) => setCell(style.id, colorway.id, box.id, v)}
                            onStep={(d) => step(style.id, colorway.id, box.id, d)}
                            label={`${box.label} for ${style.name} ${colorway.name}`}
                            max={inventory[style.id]?.[colorway.id]?.[box.id] ?? 0}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop: full linesheet table. */}
      <div className="scroll-thin hidden overflow-x-auto border border-stone-300 lg:block">
        <table className="w-full min-w-[1100px] border-collapse text-sm">
          <caption className="sr-only">Wholesale linesheet — order quantities by style and colorway</caption>
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <Th>Style</Th>
              <Th>Colorway</Th>
              <Th>Delivery</Th>
              <Th align="right">Price</Th>
              <Th align="center">8-Pair</Th>
              <Th align="center">10-Pair</Th>
              <Th align="center">12-Pair</Th>
            </tr>
          </thead>
          <tbody>
            {styles.map((style) => {
              const boxTypes = getAvailableBoxTypes(style);
              return style.colorways.map((colorway, i) => (
                <tr
                  key={`${style.id}-${colorway.id}`}
                  className={cn(
                    "border-b border-stone-200 last:border-b-0 even:bg-stone-50/40 hover:bg-signal-100/30",
                    i === 0 && "border-t-2 border-t-ink",
                  )}
                >
                  {i === 0 ? (
                    <td className="px-3 py-2.5 align-top" rowSpan={style.colorways.length}>
                      <div className="flex items-center gap-3">
                        <StylePlate
                          swatch={style.colorways[0].swatch}
                          imageUrl={getStyleImageUrl(style)}
                          alt={style.name}
                          className="h-12 w-16 shrink-0"
                          dense
                        />
                        <div className="min-w-0">
                          <Link href={`/product/${style.slug}`} className="font-medium text-ink hover:underline">
                            {style.name}
                          </Link>
                          <p className="font-mono-tab text-[11px] text-ink-soft">
                            {style.styleNumber} · {GENDER_LABEL[style.gender]}
                          </p>
                          <p className="text-[11px] text-ink-soft">{CATEGORY_LABEL[style.category]}</p>
                        </div>
                      </div>
                    </td>
                  ) : null}
                  <td className="px-3 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="flex h-4 w-6 shrink-0 overflow-hidden border border-stone-300" aria-hidden>
                        <span className="h-full w-1/2" style={{ background: colorway.swatch[0] }} />
                        <span className="h-full w-1/2" style={{ background: colorway.swatch[1] ?? colorway.swatch[0] }} />
                      </span>
                      <span className="text-ink-soft">{colorway.name}</span>
                    </span>
                  </td>
                  {i === 0 ? (
                    <td className="px-3 py-2.5 align-top" rowSpan={style.colorways.length}>
                      <AvailabilityBadge availability={style.availability} shipWindow={style.shipWindow} />
                    </td>
                  ) : null}
                  {i === 0 ? (
                    <td className="px-3 py-2.5 text-right align-top tabular-nums text-ink" rowSpan={style.colorways.length}>
                      {formatEUR(getUnitPrice(style, "net60", priceMultiplier))}
                      {isOnSale(style) && (
                        <span className="ml-1.5 bg-ember px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">Sale</span>
                      )}
                    </td>
                  ) : null}
                  {(["box8", "box10", "box12"] as BoxTypeId[]).map((boxTypeId) => (
                    <td key={boxTypeId} className="px-2 py-1.5 text-center">
                      {boxTypes.some((b) => b.id === boxTypeId) ? (
                        <Stepper
                          value={qty[style.id]?.[colorway.id]?.[boxTypeId] ?? 0}
                          onChange={(v) => setCell(style.id, colorway.id, boxTypeId, v)}
                          onStep={(d) => step(style.id, colorway.id, boxTypeId, d)}
                          label={`${boxTypeId} for ${style.name} ${colorway.name}`}
                          max={inventory[style.id]?.[colorway.id]?.[boxTypeId] ?? 0}
                        />
                      ) : (
                        <span className="text-ink-soft">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {validations.length > 0 && (
        <div className="mt-6 border border-stone-300 bg-stone-100 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Order summary by style</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {validations.map((v) => (
              <div key={v.style.id} className="flex items-center justify-between text-sm">
                <Link href={`/product/${v.style.slug}`} className="text-ink hover:underline">
                  {v.style.name}
                </Link>
                <span className="flex items-center gap-3">
                  <span className="font-mono-tab text-ink-soft">{v.totalBoxes} boxes · {v.totalPairs} pairs</span>
                  <span className="font-semibold tabular-nums text-ink">{formatEUR(v.subtotal)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-stone-300 pt-4">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold tabular-nums text-ink">Total: {formatEUR(grandTotal)}</span>
          {confirmed && validations.length === 0 && <span className="text-xs text-positive">Added to cart.</span>}
        </div>
        <button
          type="button"
          onClick={handleAddAllToCart}
          disabled={validations.length === 0}
          className={cn(
            "bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-ink/85",
            validations.length === 0 && "cursor-not-allowed bg-cinder-300 text-white/70",
          )}
        >
          Add All to Cart
        </button>
      </div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  onStep,
  label,
  max,
}: {
  value: number;
  onChange: (value: number) => void;
  onStep: (delta: number) => void;
  label: string;
  max: number;
}) {
  const outOfStock = max === 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={cn(
          "mx-auto flex w-24 items-center justify-between border px-1 py-1",
          outOfStock ? "border-stone-300 opacity-60" : value > 0 ? "border-ink bg-signal-100/40" : "border-stone-300",
        )}
      >
        <button
          type="button"
          aria-label={`Decrease ${label} quantity`}
          onClick={() => onStep(-1)}
          disabled={value === 0}
          className="flex h-6 w-6 items-center justify-center text-ink hover:text-signal disabled:opacity-30"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          max={max}
          inputMode="numeric"
          value={value || ""}
          placeholder="0"
          disabled={outOfStock}
          aria-label={`${label} quantity`}
          onChange={(e) => onChange(Number(e.target.value))}
          onFocus={(e) => e.target.select()}
          className="font-mono-tab w-8 border-0 bg-transparent text-center text-sm font-semibold tabular-nums text-ink outline-none disabled:cursor-not-allowed"
        />
        <button
          type="button"
          aria-label={`Increase ${label} quantity`}
          onClick={() => onStep(1)}
          disabled={value >= max}
          className="flex h-6 w-6 items-center justify-center text-ink hover:text-signal disabled:opacity-30"
        >
          +
        </button>
      </div>
      <span className={cn("font-mono-tab text-[9px]", outOfStock ? "text-ember" : "text-ink-soft/70")}>
        {outOfStock ? "out" : `${max} avail.`}
      </span>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft",
        align === "right" && "text-right",
        align === "center" && "text-center",
      )}
    >
      {children}
    </th>
  );
}
