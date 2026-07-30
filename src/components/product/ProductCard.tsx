import Link from "next/link";
import { CATEGORY_LABEL, GENDER_LABEL, getStyleImageUrl } from "@/lib/data/styles";
import { formatEUR, getUnitPrice, isOnSale } from "@/lib/pricing";
import type { Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { FavoriteButton } from "@/components/product/FavoriteButton";
import { QuickAdd } from "@/components/product/QuickAdd";
import { cn } from "@/lib/cn";

/**
 * Card root is a plain container, not a single wrapping `<Link>`: the card carries real
 * controls (favorite, quick add) and buttons nested inside an anchor are invalid HTML and
 * unusable with a keyboard or screen reader. The image and the title are each their own
 * link to the product; the image one is hidden from assistive tech so the card exposes a
 * single accessible destination rather than two identical ones.
 */
export function ProductCard({
  style,
  totalOnHand,
  priceMultiplier = 1,
  favorited,
  inventory,
}: {
  style: Style;
  totalOnHand?: number;
  priceMultiplier?: number;
  /** Omit to hide the favorite toggle entirely (e.g. logged-out contexts). */
  favorited?: boolean;
  /** Per-colorway/box stock. Omit to hide Quick Add (e.g. marketing surfaces with no cart). */
  inventory?: StyleInventory;
}) {
  const soldOut = totalOnHand === 0;
  const lowStock = typeof totalOnHand === "number" && totalOnHand > 0 && totalOnHand <= 10;
  const onSale = isOnSale(style);

  return (
    <div className="group flex flex-col border border-stone-300 bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(26,29,34,0.12)]">
      <div className="relative overflow-hidden">
        <Link href={`/product/${style.slug}`} tabIndex={-1} aria-hidden className="block">
          <StylePlate
            swatch={style.colorways[0].swatch}
            styleNumber={style.styleNumber}
            imageUrl={getStyleImageUrl(style)}
            alt={style.name}
            className={cn(
              "aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]",
              soldOut && "grayscale",
            )}
            dense
          />
        </Link>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          {favorited !== undefined && <FavoriteButton styleId={style.id} initialFavorited={favorited} variant="icon" />}
          {(soldOut || lowStock || onSale) && (
            <span
              className={cn(
                "px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
                soldOut ? "bg-ember" : lowStock ? "bg-ink" : "bg-ember",
              )}
            >
              {soldOut ? "Sold out" : lowStock ? "Low stock" : "Sale"}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <AvailabilityBadge availability={style.availability} shipWindow={style.shipWindow} />
          <span className="text-[11px] uppercase tracking-wide text-ink-soft">
            {CATEGORY_LABEL[style.category]}
          </span>
        </div>
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight text-ink">
          <Link href={`/product/${style.slug}`} className="hover:underline">
            {style.name}
          </Link>
        </h3>
        <p className="text-xs text-ink-soft">
          <span className="font-mono-tab">{style.styleNumber}</span> · {GENDER_LABEL[style.gender]} ·{" "}
          {style.colorways.length} colorways
        </p>

        <div className="mt-1 flex items-center gap-1.5">
          {style.colorways.slice(0, 4).map((c) => (
            <span
              key={c.id}
              role="img"
              aria-label={c.name}
              className="flex h-4 w-6 overflow-hidden border border-stone-300"
            >
              <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[0] }} />
              <span aria-hidden className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
            </span>
          ))}
        </div>

        <div className="mt-auto border-t border-stone-200 pt-3">
          <p className="text-[11px] uppercase tracking-wide text-ink-soft">Wholesale</p>
          <p className="flex items-baseline gap-2">
            <span className="text-lg font-semibold tabular-nums text-ink">
              {formatEUR(getUnitPrice(style, "net60", priceMultiplier))}
            </span>
            {onSale && (
              <span className="text-xs tabular-nums text-ink-soft line-through">
                {formatEUR(style.basePrice * priceMultiplier)}
              </span>
            )}
          </p>
        </div>

        {inventory && <QuickAdd style={style} inventory={inventory} priceMultiplier={priceMultiplier} />}
      </div>
    </div>
  );
}
