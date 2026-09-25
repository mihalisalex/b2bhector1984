"use client";

import { useState } from "react";
import Link from "next/link";
import { backorderLabelFor, categoryLabel, genderLabel, getStyleImageUrl } from "@/lib/data/styleLabels";
import { getUnitPrice, isOnSale } from "@/lib/pricing";
import { useDelivery, useFormat, useI18n } from "@/i18n/I18nProvider";
import { t } from "@/i18n/format";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { VatSuffix } from "@/components/ui/VatSuffix";
import type { Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import type { StyleImage } from "@/lib/data/styleImages";
import { StylePlate } from "@/components/product/StylePlate";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { SaleBadge } from "@/components/product/SaleBadge";
import { QuickAdd } from "@/components/product/QuickAdd";
import { ColorSwatchButton } from "@/components/product/ColorSwatchButton";
import { pickDefaultColorway } from "@/lib/productSelectionDefaults";
import { cn } from "@/lib/cn";
import { useBuyerTerms } from "@/lib/cart-context";

/**
 * Card root is a plain container, not a single wrapping `<Link>`: the card carries real
 * controls (favorite, colour swatches, quick add) and buttons nested inside an anchor are
 * invalid HTML and unusable with a keyboard or screen reader. The image and the title are
 * each their own link to the product; the image one is hidden from assistive tech so the
 * card exposes a single accessible destination rather than two identical ones.
 *
 * Client component (not just for `QuickAdd`/`FavoriteButton`): the colour swatches below
 * swap which photo is shown, same as pressing a colour on the product page, so this needs
 * its own local `activeColorwayId` state.
 */
export function ProductCard({
  style,
  totalOnHand,
  priceMultiplier = 1,
  showPricing = true,
  favorited,
  inventory,
  images = [],
  priority = false,
}: {
  style: Style;
  totalOnHand?: number;
  priceMultiplier?: number;
  /** Set false for anonymous visitors — trade pricing is for approved accounts only. The
   * card keeps its photo, name, style number and availability so the page still has real
   * content for a crawler; only the figure is withheld. */
  showPricing?: boolean;
  /** Omit to hide the favorite toggle entirely (e.g. logged-out contexts). */
  favorited?: boolean;
  /** Set on the above-the-fold cards so next/image preloads them instead of lazy-loading.
   * The catalogue's first row is the Largest Contentful Paint element, and lazy-loading it
   * delays LCP by a round trip. */
  priority?: boolean;
  /** Per-colorway/box stock. Omit to hide Quick Add (e.g. marketing surfaces with no cart). */
  inventory?: StyleInventory;
  /** Real per-colorway tagged photos. A colorway with none just keeps showing the
   * style's default photo when selected — same honest fallback as the product gallery. */
  images?: StyleImage[];
}) {
  const { eur } = useFormat();
  const { dict } = useI18n();
  const { arrivalLabel } = useDelivery();
  // The buyer's chosen payment terms (Net 60 outside a cart, where no price shows anyway).
  const buyerTerms = useBuyerTerms();
  const dictCatalog = dict.catalog;
  // "Sold out" only applies when the style truly can't be ordered further; when it can
  // (allowBackorder, the new default), zero on-hand is "Made to order" instead — still
  // purchasable, just not shipping from the shelf. See PrimaryPurchasePanel/QuickAdd for
  // the same distinction applied to the actual add-to-cart controls.
  const soldOut = totalOnHand === 0 && !style.allowBackorder;
  const backorderText = backorderLabelFor(dict, style);
  const lowStock = typeof totalOnHand === "number" && totalOnHand > 0 && totalOnHand <= 10;
  const onSale = isOnSale(style);
  const hasMultipleColorways = style.colorways.length > 1;

  const [activeColorwayId, setActiveColorwayId] = useState(() =>
    inventory ? pickDefaultColorway(style, inventory, images) : style.colorways[0].id,
  );
  const activeColorway = style.colorways.find((c) => c.id === activeColorwayId) ?? style.colorways[0];
  const taggedImage = images.find((img) => img.colorwayId === activeColorwayId);
  const imageUrl = taggedImage?.publicUrl ?? getStyleImageUrl(style);

  const deliveryText = !soldOut && typeof totalOnHand === "number" && totalOnHand > 0
    ? dictCatalog.inStockShips
    : t(dictCatalog.arrivesAround, { date: arrivalLabel });
  const unitPrice = getUnitPrice(style, buyerTerms, priceMultiplier);
  const boxTypes = getAvailableBoxTypes(style);
  // Every style is sold in one box format today; with several, the smallest box is quoted.
  const box = boxTypes.reduce((a, b) => (b.totalPairs < a.totalPairs ? b : a), boxTypes[0]);
  // What a shop owner actually compares suppliers on: recommended retail over their cost.
  const markup = style.msrp > 0 && unitPrice > 0 ? style.msrp / unitPrice : 0;

  return (
    <div className="group flex flex-col bg-white">
      <div className="relative overflow-hidden bg-transparent">
        <Link href={`/product/${style.slug}`} tabIndex={-1} aria-hidden className="block">
          {/* 4:3, not the old 4:5. The photos are portrait with the shoe centred, so the
              taller box was mostly empty grey above and below a small shoe. The wider box
              crops that empty space, shows the shoe larger and fits a row more per screen. */}
          <StylePlate
            key={imageUrl}
            swatch={activeColorway.swatch}
            styleNumber={style.styleNumber}
            imageUrl={imageUrl}
            alt={style.name}
            priority={priority}
            className={cn("aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]", soldOut && "grayscale")}
          />
        </Link>
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          <SaleBadge style={style} />
          {(soldOut || lowStock) && (
            <span className={cn("px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white", soldOut ? "bg-ember" : "bg-ink")}>
              {soldOut ? dictCatalog.soldOut : t(dictCatalog.onlyLeft, { count: totalOnHand ?? 0 })}
            </span>
          )}
        </div>
        {favorited !== undefined && (
          <div className="absolute right-2 top-2">
            <FavoriteButton styleId={style.id} initialFavorited={favorited} variant="icon" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-3 pb-3 pt-3 sm:px-4 sm:pb-4">
        <div>
          {/* Sentence case in the body face: a long name like "5109 Brown - Leather formal
              boots" set in display capitals ran to three lines and was slow to scan across a
              grid. The display face stays for page headings. */}
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
            <Link href={`/product/${style.slug}`} className="hover:underline">
              {style.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-ink-soft">
            <span className="font-mono-tab">{style.styleNumber}</span> · {categoryLabel(dict, style.category)} ·{" "}
            {genderLabel(dict, style.gender)}
          </p>
        </div>

        {hasMultipleColorways && (
          <div className="flex items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {style.colorways.map((c) => {
                const stocked = inventory ? Object.values(inventory[c.id] ?? {}).some((n) => (n ?? 0) > 0) : true;
                return (
                  <ColorSwatchButton
                    key={c.id}
                    swatch={c.swatch}
                    selected={c.id === activeColorwayId}
                    stocked={stocked}
                    size="sm"
                    label={stocked ? c.name : style.allowBackorder ? `${c.name}, ${backorderText.toLowerCase()}` : `${c.name}, ${dictCatalog.soldOut}`}
                    onClick={() => setActiveColorwayId(c.id)}
                  />
                );
              })}
            </div>
            <span className="truncate text-xs text-ink-soft">{activeColorway.name}</span>
          </div>
        )}

        {showPricing ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-stone-200 pt-2.5 tabular-nums">
            <div>
              <dt className="text-[11px] text-ink-soft">{dictCatalog.perPairLabel}</dt>
              <dd className="flex flex-wrap items-baseline gap-x-1.5">
                {/* Burgundy only while discounted — the promotional accent, deliberately not
                    --color-ember, which reads as danger/error everywhere else in this app. */}
                <span className={cn("text-base font-semibold", onSale ? "text-burgundy" : "text-ink")}>
                  {eur(unitPrice)}
                </span>
                {onSale && <span className="text-xs text-ink-soft line-through">{eur(style.basePrice * priceMultiplier)}</span>}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-ink-soft">{t(dictCatalog.boxOfLabel, { pairs: box.totalPairs })}</dt>
              <dd className="text-base font-semibold text-ink">
                {eur(unitPrice * box.totalPairs)}
                <VatSuffix vatRate={style.vatRate} className="text-[11px] font-normal text-ink-soft" />
              </dd>
            </div>
            {markup > 0 && (
              <>
                <div>
                  <dt className="text-[11px] text-ink-soft">{dictCatalog.rrpLabel}</dt>
                  <dd className="text-sm text-ink">{eur(style.msrp)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-ink-soft">{dictCatalog.markupLabel}</dt>
                  <dd className="text-sm font-semibold text-positive">×{markup.toFixed(1)}</dd>
                </div>
              </>
            )}
          </dl>
        ) : (
          <p className="border-t border-stone-200 pt-2.5 text-xs text-ink-soft">{dictCatalog.tradePricingOnApproval}</p>
        )}

        {/* One delivery line replaces the old pair of "Made to order" badges: what a buyer
            needs from it is when the boxes arrive. */}
        <p className="mt-auto flex items-center gap-2 bg-stone-100 px-2 py-1.5 text-xs text-ink">
          <span aria-hidden className={cn("h-1.5 w-1.5 shrink-0 rounded-full", soldOut ? "bg-ember" : "bg-positive")} />
          {soldOut ? dictCatalog.soldOut : deliveryText}
        </p>

        {inventory && (
          <QuickAdd style={style} inventory={inventory} priceMultiplier={priceMultiplier} colorwayId={activeColorwayId} />
        )}
      </div>
    </div>
  );
}
