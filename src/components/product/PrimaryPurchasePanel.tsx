"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useColorwaySelection } from "@/lib/colorway-selection-context";
import { pickDefaultBoxType } from "@/lib/productSelectionDefaults";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { formatEUR, getUnitPrice, isOnSale } from "@/lib/pricing";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ShareButton } from "@/components/product/ShareButton";
import type { BoxTypeId, Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import { cn } from "@/lib/cn";

export function PrimaryPurchasePanel({
  style,
  inventory,
  priceMultiplier = 1,
  initialFavorited,
}: {
  style: Style;
  inventory: StyleInventory;
  priceMultiplier?: number;
  initialFavorited: boolean;
}) {
  const { addLines, lines } = useCart();
  const boxTypes = getAvailableBoxTypes(style);

  const { colorwayId, setColorwayId } = useColorwaySelection();
  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() => pickDefaultBoxType(style, inventory, colorwayId));
  const [addQty, setAddQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(true);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Re-pick the best-stocked box type whenever the shared colorway selection changes
  // (a swatch click here, but the colorway can now also be driven from elsewhere).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the box-type choice for a newly-selected colorway, not derived render state
    setBoxTypeId(pickDefaultBoxType(style, inventory, colorwayId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the colorway change should trigger this, not every style/inventory identity change
  }, [colorwayId]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setCtaVisible(entry.isIntersecting), { threshold: 0.01 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const box = boxTypes.find((b) => b.id === boxTypeId) ?? boxTypes[0];
  const onHand = inventory[colorwayId]?.[boxTypeId] ?? 0;
  const existingQty = lines.find((l) => l.styleId === style.id && l.colorwayId === colorwayId && l.boxTypeId === boxTypeId)?.qty ?? 0;
  const remaining = Math.max(0, onHand - existingQty);
  const outOfStock = onHand === 0;
  const lowStock = onHand > 0 && onHand <= 4;

  const unitPrice = getUnitPrice(style, "net60", priceMultiplier);
  const onSale = isOnSale(style);
  const listPrice = style.basePrice * priceMultiplier;
  const pairsPerBox = box.totalPairs;
  const subtotal = useMemo(() => unitPrice * pairsPerBox * addQty, [unitPrice, pairsPerBox, addQty]);

  // Re-clamp the pending add-qty whenever the selected colorway/box combo changes stock.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamping local qty to the newly-selected combo's stock, not derived render state
    setAddQty((prev) => Math.min(Math.max(1, prev), Math.max(1, remaining)));
  }, [colorwayId, boxTypeId, remaining]);

  function step(delta: number) {
    setJustAdded(false);
    setAddQty((prev) => Math.min(remaining, Math.max(1, prev + delta)));
  }

  function handleAddToCart() {
    if (remaining <= 0) return;
    addLines(style.id, [{ colorwayId, boxTypeId, qty: existingQty + addQty }]);
    setJustAdded(true);
    setAddQty(1);
    setTimeout(() => setJustAdded(false), 2500);
  }

  const selectedColorway = style.colorways.find((c) => c.id === colorwayId) ?? style.colorways[0];

  return (
    <>
      <div className="lg:sticky lg:top-[calc(var(--shell-header-h)+1.5rem)] border border-stone-300 bg-white">
        <div className="flex items-baseline justify-between gap-3 border-b border-stone-300 bg-stone-100 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono-tab text-[11px] uppercase tracking-wide text-ink-soft">Wholesale price</span>
              {onSale && (
                <span className="bg-ember px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Sale</span>
              )}
            </div>
            <p className="flex items-baseline gap-2">
              <span className="font-mono-tab text-2xl font-bold tabular-nums text-ink">{formatEUR(unitPrice)}</span>
              <span className="text-xs font-normal text-ink-soft">/ pair</span>
              {onSale && <span className="font-mono-tab text-sm text-ink-soft line-through">{formatEUR(listPrice)}</span>}
            </p>
          </div>
          <p className="max-w-[42%] text-right text-[11px] leading-snug text-ink-soft">
            Prepay for 10% off, net-30 for 5% off — set at checkout.
          </p>
        </div>

        <div className="space-y-4 p-4">
          {/* Colorway selector */}
          {style.colorways.length > 1 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
                Colorway — <span className="text-ink">{selectedColorway.name}</span>
              </p>
              <div className="flex flex-wrap gap-3">
                {style.colorways.map((c) => {
                  const anyStock = Object.values(inventory[c.id] ?? {}).some((n) => (n ?? 0) > 0);
                  const selected = c.id === colorwayId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColorwayId(c.id)}
                      title={c.name}
                      aria-label={c.name}
                      aria-pressed={selected}
                      className="group flex w-14 flex-col items-center gap-1.5"
                    >
                      <span
                        className={cn(
                          "block h-11 w-11 overflow-hidden rounded-full ring-offset-2 transition-all",
                          selected ? "ring-2 ring-ink" : "ring-1 ring-stone-300 group-hover:ring-cinder-300",
                          !anyStock && "opacity-40",
                        )}
                      >
                        <span className="flex h-full w-full">
                          <span className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                          <span className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
                        </span>
                      </span>
                      <span className={cn("truncate text-[10px] leading-tight", selected ? "font-semibold text-ink" : "text-ink-soft")}>
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Box type selector */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Box size</p>
            <div className={cn("grid gap-2", boxTypes.length === 1 ? "grid-cols-1" : boxTypes.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {boxTypes.map((b) => {
                const stock = inventory[colorwayId]?.[b.id] ?? 0;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBoxTypeId(b.id)}
                    aria-pressed={b.id === boxTypeId}
                    className={cn(
                      "flex flex-col items-center gap-0.5 border px-2 py-2.5 text-center transition-colors",
                      b.id === boxTypeId ? "border-ink bg-signal-100/40" : "border-stone-300 hover:border-cinder-300",
                      stock === 0 && "opacity-50",
                    )}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink">{b.label}</span>
                    <span className="font-mono-tab text-[10px] text-ink-soft">{b.totalPairs} pairs</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock line */}
          <p className={cn("text-xs font-medium", outOfStock ? "text-ember" : lowStock ? "text-ember" : "text-positive")}>
            {outOfStock ? "Out of stock in this combination" : lowStock ? `Only ${onHand} box${onHand === 1 ? "" : "es"} left` : `${onHand} boxes available`}
            {existingQty > 0 && <span className="ml-1.5 text-ink-soft">· {existingQty} already in cart</span>}
          </p>

          {/* Quantity stepper */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Boxes to add</p>
            <div className="flex items-center border border-stone-300">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={addQty <= 1}
                aria-label="Decrease quantity"
                className="flex h-12 w-12 items-center justify-center text-lg text-ink hover:bg-stone-100 disabled:opacity-30"
              >
                −
              </button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={Math.max(1, remaining)}
                value={addQty}
                disabled={outOfStock}
                onChange={(e) => setAddQty(Math.min(Math.max(1, remaining), Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
                onFocus={(e) => e.target.select()}
                aria-label="Quantity of boxes"
                className="font-mono-tab h-12 w-16 border-x border-stone-300 bg-transparent text-center text-lg font-semibold tabular-nums text-ink outline-none disabled:text-ink-soft"
              />
              <button
                type="button"
                onClick={() => step(1)}
                disabled={addQty >= remaining}
                aria-label="Increase quantity"
                className="flex h-12 w-12 items-center justify-center text-lg text-ink hover:bg-stone-100 disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>

          {/* Subtotal + CTA */}
          <div ref={ctaRef} className="border-t border-stone-200 pt-4">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Subtotal · {addQty * pairsPerBox} pairs
              </span>
              <span className="font-mono-tab text-xl font-bold text-ink">{formatEUR(subtotal)}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={remaining <= 0}
                className="flex-1 bg-ink px-6 py-4 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_10px_24px_rgba(26,29,34,0.18)] transition-colors hover:bg-ink/85 disabled:cursor-not-allowed disabled:bg-cinder-300 disabled:text-white/70 disabled:shadow-none"
              >
                {outOfStock ? "Out of Stock" : justAdded ? "Added ✓" : "Add to Cart"}
              </button>
              <FavoriteButton styleId={style.id} initialFavorited={initialFavorited} />
              <ShareButton title={style.name} />
            </div>
            {justAdded && (
              <p className="mt-2 text-xs font-medium text-positive">
                Added to cart. <a href="/cart" className="underline hover:text-ink">View cart</a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom bar — only rendered once the main CTA has scrolled out of view */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-stone-300 bg-white/97 px-4 py-3 backdrop-blur transition-transform duration-200 lg:hidden",
          ctaVisible ? "translate-y-full" : "translate-y-0",
        )}
        style={{ boxShadow: "0 -8px 24px rgba(26,29,34,0.12)" }}
        aria-hidden={ctaVisible}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-stone-300">
            <button type="button" onClick={() => step(-1)} disabled={addQty <= 1} aria-label="Decrease quantity" className="flex h-11 w-10 items-center justify-center text-ink disabled:opacity-30">−</button>
            <span className="font-mono-tab flex h-11 w-9 items-center justify-center text-base font-semibold text-ink">{addQty}</span>
            <button type="button" onClick={() => step(1)} disabled={addQty >= remaining} aria-label="Increase quantity" className="flex h-11 w-10 items-center justify-center text-ink disabled:opacity-30">+</button>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-mono-tab truncate text-base font-bold text-ink">{formatEUR(subtotal)}</p>
            <p className="truncate text-[10px] text-ink-soft">{box.label} · {selectedColorway.name}</p>
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={remaining <= 0}
            className="shrink-0 bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white disabled:bg-cinder-300"
          >
            {outOfStock ? "Sold Out" : justAdded ? "Added ✓" : "Add to Cart"}
          </button>
        </div>
      </div>
      {/* Reserves space so the fixed bar doesn't cover page content/footer on mobile */}
      {!ctaVisible && <div className="h-[76px] lg:hidden" aria-hidden />}
    </>
  );
}
