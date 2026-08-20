"use client";

import { useState } from "react";
import Link from "next/link";
import { backorderLabel, CATEGORY_LABEL, GENDER_LABEL, getStyleImageUrl } from "@/lib/data/styleLabels";
import { getUnitPrice, isOnSale } from "@/lib/pricing";
import { useFormat } from "@/i18n/I18nProvider";
import { VatSuffix } from "@/components/ui/VatSuffix";
import type { Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import type { StyleImage } from "@/lib/data/styleImages";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { SaleBadge } from "@/components/product/SaleBadge";
import { QuickAdd } from "@/components/product/QuickAdd";
import { ColorSwatchButton } from "@/components/product/ColorSwatchButton";
import { pickDefaultColorway } from "@/lib/productSelectionDefaults";
import { cn } from "@/lib/cn";

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
  // "Sold out" only applies when the style truly can't be ordered further; when it can
  // (allowBackorder, the new default), zero on-hand is "Made to order" instead — still
  // purchasable, just not shipping from the shelf. See PrimaryPurchasePanel/QuickAdd for
  // the same distinction applied to the actual add-to-cart controls.
  const soldOut = totalOnHand === 0 && !style.allowBackorder;
  const madeToOrder = totalOnHand === 0 && style.allowBackorder;
  const backorderText = backorderLabel(style);
  const lowStock = typeof totalOnHand === "number" && totalOnHand > 0 && totalOnHand <= 10;
  const onSale = isOnSale(style);
  const hasMultipleColorways = style.colorways.length > 1;

  const [activeColorwayId, setActiveColorwayId] = useState(() =>
    inventory ? pickDefaultColorway(style, inventory, images) : style.colorways[0].id,
  );
  const activeColorway = style.colorways.find((c) => c.id === activeColorwayId) ?? style.colorways[0];
  const taggedImage = images.find((img) => img.colorwayId === activeColorwayId);
  const imageUrl = taggedImage?.publicUrl ?? getStyleImageUrl(style);

  return (
    <div className="group flex flex-col transition-transform duration-300 ease-out hover:-translate-y-0.5">
      <div className="relative overflow-hidden bg-transparent">
        <Link href={`/product/${style.slug}`} tabIndex={-1} aria-hidden className="block">
          <StylePlate
            key={imageUrl}
            swatch={activeColorway.swatch}
            styleNumber={style.styleNumber}
            imageUrl={imageUrl}
            alt={style.name}
            priority={priority}
            className={cn("aspect-[4/5] w-full transition-transform duration-500 ease-out group-hover:scale-[1.02]", soldOut && "grayscale")}
          />
        </Link>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          {favorited !== undefined && <FavoriteButton styleId={style.id} initialFavorited={favorited} variant="icon" />}
          {/* Availability and discount are independent facts, so they get independent badges.
              They used to share one slot in a single ternary chain, which meant a discounted
              style that was also made-to-order silently lost its Sale flag — the common case
              here, since the winter sale styles are largely made to order. */}
          {(soldOut || madeToOrder || lowStock) && (
            <span
              className={cn(
                "px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
                soldOut ? "bg-ember" : "bg-ink",
              )}
            >
              {soldOut ? "Sold out" : madeToOrder ? backorderText : "Low stock"}
            </span>
          )}
          <SaleBadge style={style} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-3">
        <AvailabilityBadge style={style} stockOverridden={soldOut || madeToOrder} />
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight text-ink">
          <Link href={`/product/${style.slug}`} className="hover:underline">
            {style.name}
          </Link>
        </h3>
        <p className="text-xs uppercase tracking-wide text-ink-soft">
          <span className="font-mono-tab normal-case">{style.styleNumber}</span> · {GENDER_LABEL[style.gender]} ·{" "}
          {CATEGORY_LABEL[style.category]}
        </p>

        <div className="mt-auto border-t border-stone-200 pt-3">
          {showPricing ? (
            <>
              <p className="text-[11px] uppercase tracking-wide text-ink-soft">Wholesale</p>
              <p className="flex items-baseline gap-2">
                {/* Burgundy only while discounted — the promotional accent, deliberately not
                    --color-ember, which reads as danger/error everywhere else in this app. */}
                <span className={cn("text-lg font-semibold tabular-nums", onSale ? "text-burgundy" : "text-ink")}>
                  {eur(getUnitPrice(style, "net60", priceMultiplier))}
                  <VatSuffix vatRate={style.vatRate} className="text-xs font-normal text-ink-soft" />
                </span>
                {onSale && (
                  <span className="text-xs tabular-nums text-ink-soft line-through">
                    {eur(style.basePrice * priceMultiplier)}
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-[11px] uppercase tracking-wide text-ink-soft">Trade pricing on approval</p>
          )}
        </div>

        {hasMultipleColorways && (
          <div>
            <p className="mb-1.5 text-[11px] uppercase tracking-wide text-ink-soft">
              Colours — <span className="text-ink">{activeColorway.name}</span>
            </p>
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
                    label={stocked ? c.name : style.allowBackorder ? `${c.name}, ${backorderText.toLowerCase()}` : `${c.name}, out of stock`}
                    onClick={() => setActiveColorwayId(c.id)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {inventory && (
          <QuickAdd style={style} inventory={inventory} priceMultiplier={priceMultiplier} colorwayId={activeColorwayId} />
        )}
      </div>
    </div>
  );
}
