"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useDelivery, useI18n, useFormat } from "@/i18n/I18nProvider";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import { useColorwaySelection } from "@/lib/colorway-selection-context";
import { pickDefaultBoxType } from "@/lib/productSelectionDefaults";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { getUnitPrice, isOnSale, MAX_BACKORDER_QTY, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { SaleBadge } from "@/components/product/SaleBadge";
import { TermsSwitch } from "@/components/product/TermsSwitch";
import { ColorwayPicker } from "@/components/product/ColorwayPicker";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { ShareButton } from "@/components/product/ShareButton";
import { StepIcon } from "@/components/ui/StepIcon";
import { useCancelableTimeout } from "@/lib/useCancelableTimeout";
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
  const { addLines, lines, itemCount, minOrderPairs: accountMinOrderPairs, chargesVat, terms } = useCart();
  const minOrderPairs = accountMinOrderPairs ?? MIN_ORDER_PAIRS;
  const { arrivalLabel } = useDelivery();
  const { locale, dict } = useI18n();
  const { eur } = useFormat();
  const c = dict.catalog;
  const boxTypes = getAvailableBoxTypes(style);

  const { colorwayId } = useColorwaySelection();
  const [boxTypeId, setBoxTypeId] = useState<BoxTypeId>(() => pickDefaultBoxType(style, inventory, colorwayId));
  const [addQty, setAddQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [reachedBrowsing, setReachedBrowsing] = useState(false);
  const scheduleReset = useCancelableTimeout();

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
  const allowBackorder = style.allowBackorder;
  const outOfStock = onHand === 0 && !allowBackorder;
  const maxSelectable = allowBackorder ? MAX_BACKORDER_QTY : remaining;
  const willBeProduction = allowBackorder && existingQty + addQty > onHand;

  // Every figure is at the buyer's chosen payment terms (TermsSwitch), not the Net-60 list
  // price — the old panel showed list and only revealed the prepay price at checkout.
  const unitPrice = getUnitPrice(style, terms, priceMultiplier);
  const listUnitPrice = Math.round(style.basePrice * priceMultiplier * 100) / 100;
  const discounted = unitPrice < listUnitPrice;
  const onSale = isOnSale(style);
  const pairsPerBox = box.totalPairs;
  const boxPrice = unitPrice * pairsPerBox;
  const subtotal = useMemo(() => boxPrice * addQty, [boxPrice, addQty]);
  const markup = style.msrp > 0 && unitPrice > 0 ? style.msrp / unitPrice : 0;

  const pendingPairs = addQty * pairsPerBox;
  const pairsAfterAdd = itemCount + pendingPairs;
  const pairsShort = Math.max(0, minOrderPairs - pairsAfterAdd);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clamping to a new ceiling, not derived render state
    setAddQty((prev) => Math.min(Math.max(1, prev), Math.max(1, maxSelectable)));
  }, [colorwayId, boxTypeId, maxSelectable]);

  function setQty(next: number) {
    setJustAdded(false);
    setAddQty(Math.min(maxSelectable, Math.max(1, Math.floor(next) || 1)));
  }

  function handleAddToCart() {
    if (remaining <= 0 && !allowBackorder) return;
    addLines(style.id, [{ colorwayId, boxTypeId, qty: existingQty + addQty }]);
    setJustAdded(true);
    setAddQty(1);
    scheduleReset(() => setJustAdded(false), 2500);
  }

  const addLabel = outOfStock
    ? c.soldOut
    : justAdded
      ? c.addedToCart
      : t(c.addBoxesSummary, { boxes: addQty, pairs: pairsPerBox, total: eur(subtotal) });
  const barVisible = !reachedBrowsing;

  return (
    <>
      <div className="border border-stone-300 bg-white">
        <div className="space-y-4 px-5 py-5 sm:px-6">
          {/* Colour lives in the sticky bar on phones; on desktop there is no bar, so here. */}
          {style.colorways.length > 1 && (
            <div className="hidden lg:block">
              <ColorwayPicker style={style} inventory={inventory} />
            </div>
          )}
          <TermsSwitch />

          {/* The three numbers a shop owner decides on, side by side: what a pair costs,
              what the box they actually order costs, and what it sells for in their shop. */}
          <dl className="grid grid-cols-3 border border-stone-200 tabular-nums">
            <div className="border-r border-stone-200 p-3">
              <dt className="text-[11px] text-ink-soft">{c.perPairLabel}</dt>
              <dd className={cn("mt-0.5 text-lg font-semibold leading-tight sm:text-xl", onSale ? "text-burgundy" : "text-ink")}>
                {eur(unitPrice)}
              </dd>
              {discounted && (
                <dd className="text-[11px] text-ink-soft line-through">{t(c.listPriceLabel, { price: eur(listUnitPrice) })}</dd>
              )}
              {/* The struck list price already says it; the badge only fits from `sm` up. */}
              {onSale && <dd className="mt-1 hidden sm:block"><SaleBadge style={style} /></dd>}
            </div>
            <div className="border-r border-stone-200 p-3">
              <dt className="text-[11px] text-ink-soft">{t(c.boxOfLabel, { pairs: pairsPerBox })}</dt>
              <dd className="mt-0.5 text-lg font-semibold leading-tight text-ink sm:text-xl">{eur(boxPrice)}</dd>
              <dd className="text-[11px] text-ink-soft">{chargesVat ? c.vatForGreece : c.noVatAbroad}</dd>
            </div>
            <div className="p-3">
              <dt className="text-[11px] text-ink-soft">{c.rrpLabel}</dt>
              <dd className="mt-0.5 text-lg font-semibold leading-tight text-ink sm:text-xl">{style.msrp > 0 ? eur(style.msrp) : "—"}</dd>
              {markup > 0 && (
                <dd className="text-[11px] font-semibold text-positive">
                  {c.markupLabel} ×{markup.toFixed(1)}
                </dd>
              )}
            </div>
          </dl>

          {boxTypes.length > 1 && (
            <div>
              <p className="mb-2 text-xs font-medium text-ink-soft">{c.boxSize}</p>
              <div className="flex flex-wrap gap-2">
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
                        "rounded-full px-3.5 py-2 text-xs font-semibold tabular-nums transition-colors duration-150",
                        active ? "bg-ink text-white" : "bg-stone-100 text-ink-soft hover:bg-stone-200",
                        stock === 0 && !allowBackorder && "opacity-45",
                      )}
                    >
                      {t(c.prePackBox, { pairs: b.totalPairs })}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* A date, not a duration: "around 14 Nov" is what a buyer plans a season around. */}
          <div className={cn("border-l-[3px] px-3 py-2 text-sm", outOfStock ? "border-ember bg-ember-100" : "border-positive bg-positive-100")}>
            {outOfStock ? (
              <p className="font-medium text-ember">{c.outOfStockCombo}</p>
            ) : willBeProduction || onHand === 0 ? (
              <>
                <p className="text-ink">
                  <span className="font-semibold">{c.madeForYou}</span> · {t(c.arrivesAroundToday, { date: arrivalLabel })}
                </p>
                <p className="mt-0.5 text-xs text-ink-soft">{c.etaLargeOrders}</p>
              </>
            ) : (
              <p className="text-ink">{t(c.inStockBoxes, { count: remaining })}</p>
            )}
          </div>

          <div className="hidden items-stretch gap-2 lg:flex">
            <QtyInput
              qty={addQty}
              max={maxSelectable}
              disabled={outOfStock}
              onChange={setQty}
              label={c.boxesLabel}
            />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 rounded-full bg-ink px-4 py-3 text-xs font-semibold uppercase tracking-[0.06em] text-white tabular-nums transition-colors hover:bg-ink/85 disabled:bg-cinder-300 disabled:text-white/70"
            >
              {addLabel}
            </button>
          </div>

          {!outOfStock && (
            <p className={cn("text-xs leading-snug", pairsShort > 0 ? "text-ink-soft" : "text-positive")}>
              {/* Whole sentences from the dictionary rather than JSX fragments around a
                  bolded number: Greek inflects the rest of the clause with the count. */}
              {pairsShort > 0
                ? t(c.takesOrderTo, { pairs: pairsAfterAdd, short: pairsShort, min: minOrderPairs })
                : t(c.meetsMinimum, { min: minOrderPairs, pairs: pairsAfterAdd })}
              {existingQty > 0 && <span className="text-ink-soft"> · {t(c.inCartCount, { count: existingQty })}</span>}
            </p>
          )}

          {justAdded && (
            <p className="text-xs font-medium text-positive" role="status">
              {c.addedViewCart}{" "}
              <Link href={withLocale(locale, "/cart")} className="underline hover:text-ink">
                {c.viewCart}
              </Link>
            </p>
          )}

          <div className="flex items-center gap-2">
            <FavoriteButton styleId={style.id} initialFavorited={initialFavorited} />
            <ShareButton title={style.name} />
          </div>
        </div>
      </div>

      {/* Phones only: a sticky bar so the buyer never scrolls back up to add. On desktop the
          panel above sits beside the photos and already holds everything, so a second
          add-to-cart pinned to the bottom of the screen only duplicated it. Releases once
          the related styles scroll in. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 bg-white/97 px-4 pb-3 pt-3 backdrop-blur-md transition-transform duration-300 ease-out lg:hidden",
          barVisible ? "translate-y-0" : "translate-y-full",
        )}
        style={{ boxShadow: "0 -10px 30px rgba(26,29,34,0.12)", paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!barVisible}
      >
        <div className="mx-auto max-w-[600px]">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-sm tabular-nums text-ink">
              <span className="font-semibold">{eur(boxPrice)}</span>
              <span className="text-xs text-ink-soft"> · {t(c.boxOfLabel, { pairs: pairsPerBox })} · {eur(unitPrice)}{c.perPair}</span>
            </p>
            <ColorwayPicker style={style} inventory={inventory} className="-mr-1 shrink-0" />
          </div>
          <div className="mt-2.5 flex items-stretch gap-2">
            <QtyInput qty={addQty} max={maxSelectable} disabled={outOfStock} onChange={setQty} label={c.boxesLabel} />
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={outOfStock}
              className="flex-1 rounded-full bg-ink px-3 text-xs font-semibold uppercase tracking-[0.06em] text-white tabular-nums transition-transform active:scale-[0.99] disabled:bg-cinder-300 disabled:text-white/70"
            >
              {addLabel}
            </button>
          </div>
        </div>
      </div>
      {/* Reserves space so the fixed bar doesn't cover page content/footer (phones only) */}
      {barVisible && <div className="h-[108px] lg:hidden" aria-hidden />}
    </>
  );
}

/**
 * Box quantity: − and + for small changes, and a real number field for large ones — ordering
 * 20 boxes used to mean nineteen taps on +. Both glyphs are drawn as SVG on an identical
 * 16x16 grid; a Unicode minus beside an ASCII plus renders at visibly different weights.
 */
function QtyInput({
  qty,
  max,
  disabled,
  onChange,
  label,
}: {
  qty: number;
  max: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  label: string;
}) {
  const c = useI18n().dict.catalog;
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-full bg-stone-100">
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        disabled={disabled || qty <= 1}
        aria-label={c.decreaseQty}
        className="flex h-11 w-10 items-center justify-center text-ink transition-colors hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <StepIcon kind="minus" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={draft ?? String(qty)}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== null) onChange(Number(draft));
          setDraft(null);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="font-mono-tab h-11 w-12 appearance-none bg-transparent text-center text-base font-bold tabular-nums text-ink outline-none focus-visible:bg-white [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        disabled={disabled || qty >= max}
        aria-label={c.increaseQty}
        className="flex h-11 w-10 items-center justify-center text-ink transition-colors hover:bg-stone-200 disabled:opacity-30 disabled:hover:bg-transparent"
      >
        <StepIcon kind="plus" />
      </button>
    </div>
  );
}
