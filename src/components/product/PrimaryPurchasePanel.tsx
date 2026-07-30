"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useColorwaySelection } from "@/lib/colorway-selection-context";
import { pickDefaultBoxType } from "@/lib/productSelectionDefaults";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { formatEUR, getUnitPrice, isOnSale, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { ColorwayPicker } from "@/components/product/ColorwayPicker";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ShareButton } from "@/components/product/ShareButton";
import type { BoxTypeId, Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import { cn } from "@/lib/cn";

/**
 * Id of the sentinel the product page renders just above its related-styles section.
 * The mobile buy bar watches it to know when to release.
 */
export const BUY_BAR_RELEASE_ID = "product-buybar-release";

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
  const { addLines, lines, itemCount } = useCart();
  const boxTypes = getAvailableBoxTypes(style);

  const { colorwayId } = useColorwaySelection();
  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() => pickDefaultBoxType(style, inventory, colorwayId));
  const [addQty, setAddQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [reachedBrowsing, setReachedBrowsing] = useState(false);

  // Re-pick the best-stocked box type whenever the shared colorway selection changes
  // (a swatch click here, but the colorway can now also be driven from elsewhere).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting the box-type choice for a newly-selected colorway, not derived render state
    setBoxTypeId(pickDefaultBoxType(style, inventory, colorwayId));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the colorway change should trigger this, not every style/inventory identity change
  }, [colorwayId]);

  // Release the sticky bar once the buyer reaches the related-styles section: past that
  // point they've moved from deciding on this style to browsing the category, and a
  // permanent bar just eats screen. The sentinel is rendered by the product page.
  useEffect(() => {
    const el = document.getElementById(BUY_BAR_RELEASE_ID);
    if (!el || typeof IntersectionObserver === "undefined") return;
    // Shrink the root to its top 30%: a bare sentinel would intersect the moment it
    // clipped the bottom edge, which happens *before* the in-page CTA has scrolled away —
    // the bar would then never appear at all. This fires only once the related styles have
    // genuinely taken over the screen.
    // `top < 0` keeps it released once the sentinel has scrolled clear off the top —
    // otherwise the bar would pop back the moment it left the band on the way down.
    const observer = new IntersectionObserver(
      ([entry]) => setReachedBrowsing(entry.isIntersecting || entry.boundingClientRect.top < 0),
      { rootMargin: "0px 0px -70% 0px" },
    );
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

  // The 40-pair order minimum is enforced in the cart, at checkout, and server-side in
  // placeOrder — but until now it was invisible here, so a buyer could add a single box and
  // only discover the wall two screens later. `itemCount` is cart-wide pairs; the minimum is
  // mixable across styles, so this projects the total *after* this add rather than per-style.
  const pendingPairs = addQty * pairsPerBox;
  const pairsAfterAdd = itemCount + pendingPairs;
  const pairsShort = Math.max(0, MIN_ORDER_PAIRS - pairsAfterAdd);

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
  // On mobile the bar is the only Add-to-cart, so it stays up for the whole decision and
  // only steps aside once the buyer moves on to browsing the category.
  const barVisible = !reachedBrowsing;

  return (
    <>
      <div className="lg:sticky lg:top-[calc(var(--shell-header-h)+1.5rem)] border border-stone-300 bg-white">
        {/* Price — the anchor of the panel on desktop. Hidden on mobile, where the sticky
            bar already carries name + price and repeating them here just adds noise. */}
        <div className="hidden px-5 pt-5 sm:px-6 sm:pt-6 lg:block">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              Wholesale
            </span>
            {onSale && (
              <span className="bg-ember px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Sale
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span className="font-mono-tab text-[2.125rem] font-bold leading-none tabular-nums text-ink">
              {formatEUR(unitPrice)}
            </span>
            <span className="text-xs text-ink-soft">per pair</span>
            {onSale && (
              <span className="font-mono-tab text-sm text-ink-soft line-through">{formatEUR(listPrice)}</span>
            )}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
            Prepay 10% off · Net 30 5% off · Net 60 at list — chosen at checkout
          </p>
        </div>

        <Divider className="mt-5 hidden lg:block" />

        <div className="space-y-5 px-5 py-5 sm:px-6">
          {/* Desktop only: on mobile this lives directly under the gallery, where the
              buyer can actually see the photo change. */}
          <ColorwayPicker style={style} inventory={inventory} className="hidden lg:block" />

          <div>
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Box size
            </p>
            <div className={cn("grid gap-2", boxTypes.length === 1 ? "grid-cols-1" : boxTypes.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
              {boxTypes.map((b) => {
                const stock = inventory[colorwayId]?.[b.id] ?? 0;
                const active = b.id === boxTypeId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBoxTypeId(b.id)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-0.5 py-3 text-center transition-colors duration-150",
                      active ? "bg-ink text-white" : "bg-stone-100 text-ink-soft hover:bg-stone-200",
                      stock === 0 && "opacity-45",
                    )}
                  >
                    <span className="font-mono-tab text-base font-bold leading-none tabular-nums">
                      {b.totalPairs}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.1em]">pairs</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="mb-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Boxes
            </p>
            <p className={cn("text-xs font-medium", outOfStock || lowStock ? "text-ember" : "text-ink-soft")}>
              {outOfStock
                ? "Out of stock in this combination"
                : lowStock
                  ? `Only ${onHand} left`
                  : `${onHand} in stock`}
              {existingQty > 0 && <span className="text-ink-soft"> · {existingQty} in cart</span>}
            </p>
          </div>

          <Stepper
            qty={addQty}
            max={remaining}
            disabled={outOfStock}
            onStep={step}
            onSet={(n) => setAddQty(n)}
            className="hidden lg:flex"
          />

          <div>
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                {addQty * pairsPerBox} pairs
              </span>
              <span className="font-mono-tab text-2xl font-bold tabular-nums text-ink">{formatEUR(subtotal)}</span>
            </div>

            {!outOfStock && (
              <p className={cn("mt-2 text-[11px] leading-snug", pairsShort > 0 ? "text-ink-soft" : "text-positive")}>
                {pairsShort > 0 ? (
                  <>
                    Takes your order to <span className="font-semibold text-ink">{pairsAfterAdd} pairs</span> —{" "}
                    {pairsShort} short of the {MIN_ORDER_PAIRS}-pair minimum, mixable across any styles.
                  </>
                ) : (
                  <>Meets the {MIN_ORDER_PAIRS}-pair order minimum ({pairsAfterAdd} pairs after adding).</>
                )}
              </p>
            )}

            {/* Desktop-only: on mobile the sticky bar is the single Add-to-cart, so a
                second one here would compete with it. */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={remaining <= 0}
              className="mt-4 hidden w-full bg-ink px-6 py-4 text-sm font-semibold uppercase tracking-[0.1em] text-white transition-all duration-150 hover:bg-ink/85 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-cinder-300 disabled:text-white/70 lg:block"
            >
              {outOfStock ? "Out of stock" : justAdded ? "Added to cart ✓" : "Add to cart"}
            </button>

            <div className="mt-2.5 flex items-center gap-2">
              <FavoriteButton styleId={style.id} initialFavorited={initialFavorited} />
              <ShareButton title={style.name} />
            </div>

            {justAdded && (
              <p className="mt-2.5 text-xs font-medium text-positive">
                Added.{" "}
                <a href="/cart" className="underline hover:text-ink">
                  View cart
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky purchase bar — carries everything needed to buy (name, price,
          colour, quantity, CTA) so the buyer never scrolls back up. It releases once the
          related-products section comes into view, handing the screen over to browsing. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 bg-white/97 px-4 pb-3 pt-3 backdrop-blur-md transition-transform duration-300 ease-out lg:hidden",
          barVisible ? "translate-y-0" : "translate-y-full",
        )}
        style={{ boxShadow: "0 -10px 30px rgba(26,29,34,0.12)" }}
        aria-hidden={!barVisible}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-tight text-ink">{style.name}</p>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="font-mono-tab text-sm font-bold tabular-nums text-ink">
                {formatEUR(unitPrice)}
              </span>
              <span className="text-[11px] text-ink-soft">/ pair · {selectedColorway.name}</span>
            </p>
          </div>
          <ColorwayPicker style={style} inventory={inventory} compact className="-mr-1 shrink-0" />
        </div>

        <div className="mt-2.5 flex items-stretch gap-2">
          <Stepper qty={addQty} max={remaining} disabled={outOfStock} onStep={step} compact />
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={remaining <= 0}
            className="flex-1 bg-ink px-3 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-transform active:scale-[0.99] disabled:bg-cinder-300 disabled:text-white/70"
          >
            {outOfStock
              ? "Sold out"
              : justAdded
                ? "Added to cart ✓"
                : `Add ${box.totalPairs}-pair box${addQty > 1 ? "es" : ""} · ${formatEUR(subtotal)}`}
          </button>
        </div>
      </div>
      {/* Reserves space so the fixed bar doesn't cover page content/footer on mobile */}
      {barVisible && <div className="h-[108px] lg:hidden" aria-hidden />}
    </>
  );
}

function Divider({ className }: { className?: string }) {
  // Background, not a border: globals.css has an unlayered `* { border-color }` rule that
  // overrides every Tailwind border-color utility, so borders can't be tuned per-surface.
  return <div className={cn("h-px bg-stone-200", className)} aria-hidden />;
}

/**
 * Quantity stepper. Both glyphs are drawn as SVG on an identical 16x16 grid — the previous
 * version paired a Unicode minus with an ASCII plus, which render at visibly different
 * weights and sizes in the body face and made the control look broken.
 */
function Stepper({
  qty,
  max,
  disabled,
  onStep,
  onSet,
  compact,
  className,
}: {
  qty: number;
  max: number;
  disabled?: boolean;
  onStep: (delta: number) => void;
  onSet?: (n: number) => void;
  compact?: boolean;
  className?: string;
}) {
  const size = compact ? "h-11 w-10" : "h-14 w-14";
  return (
    <div className={cn("flex items-center bg-stone-100", compact ? "shrink-0" : "w-full", className)}>
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={disabled || qty <= 1}
        aria-label="Decrease quantity"
        className={cn(
          "flex shrink-0 items-center justify-center text-ink transition-colors hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent",
          size,
        )}
      >
        <StepIcon kind="minus" />
      </button>
      {onSet && !compact ? (
        <input
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.max(1, max)}
          value={qty}
          disabled={disabled}
          onChange={(e) => onSet(Math.min(Math.max(1, max), Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
          onFocus={(e) => e.target.select()}
          aria-label="Number of boxes"
          className="font-mono-tab h-14 flex-1 bg-transparent text-center text-xl font-bold tabular-nums text-ink outline-none disabled:text-ink-soft"
        />
      ) : (
        <span
          className={cn(
            "font-mono-tab flex items-center justify-center text-base font-bold tabular-nums text-ink",
            compact ? "h-11 w-9" : "h-14 flex-1 text-xl",
          )}
        >
          {qty}
        </span>
      )}
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={disabled || qty >= max}
        aria-label="Increase quantity"
        className={cn(
          "flex shrink-0 items-center justify-center text-ink transition-colors hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent",
          size,
        )}
      >
        <StepIcon kind="plus" />
      </button>
    </div>
  );
}

function StepIcon({ kind }: { kind: "minus" | "plus" }) {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="1.5" y="7.25" width="13" height="1.5" />
      {kind === "plus" && <rect x="7.25" y="1.5" width="1.5" height="13" />}
    </svg>
  );
}
