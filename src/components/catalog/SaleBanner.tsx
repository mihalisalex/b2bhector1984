import Link from "next/link";
import { getEffectiveBasePrice, isOnSale } from "@/lib/pricing";
import type { Style } from "@/lib/types";

/**
 * Slim sale strip for the catalogue.
 *
 * Everything it says is derived from the styles it's handed — the discount percentage is
 * measured off the real sale prices, not written into the copy. If the sale ends (sale_price
 * cleared, or a sale window expires) this renders nothing on the next request, and it can
 * never advertise a discount that isn't actually live.
 *
 * Reads through `isOnSale`/`getEffectiveBasePrice` rather than comparing `salePrice` itself,
 * so scheduled sale windows are respected exactly as they are at checkout.
 */
export function SaleBanner({ styles, seasonFiltered = false }: { styles: Style[]; seasonFiltered?: boolean }) {
  const onSale = styles.filter((s) => isOnSale(s));
  if (onSale.length === 0) return null;

  // Round per style, then take the range — a single "10%" only claims a flat rate when the
  // discounts really are uniform.
  const percents = onSale.map((s) =>
    Math.round((1 - getEffectiveBasePrice(s) / s.basePrice) * 100),
  );
  const min = Math.min(...percents);
  const max = Math.max(...percents);
  const rate = min === max ? `${max}%` : `up to ${max}%`;

  // Only call it a season sale when the discounted set really is that one season.
  const seasons = new Set(onSale.map((s) => s.season));
  const label =
    seasons.size === 1 && seasons.has("winter")
      ? "Winter sale"
      : seasons.size === 1 && seasons.has("summer")
        ? "Summer sale"
        : "Sale";

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-l-2 border-burgundy bg-stone-100 py-3 pl-4 pr-4">
      <span className="font-mono-tab text-[11px] uppercase tracking-[0.22em] text-burgundy">{label}</span>
      <p className="text-[13px] leading-snug text-ink">
        <span className="font-semibold">{rate} off</span>{" "}
        <span className="text-ink-soft">
          on {onSale.length} {onSale.length === 1 ? "style" : "styles"} — discount already applied to the prices below.
        </span>
      </p>
      {/* Links to the sale facet, not the season: "View them" means the discounted styles,
          and `?season=winter` also matched every "both"-season style (17 instead of 8). */}
      {!seasonFiltered && (
        <Link
          href="/catalogue?flag=sale"
          className="ml-auto shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-burgundy underline-offset-4 hover:underline"
        >
          View them →
        </Link>
      )}
    </div>
  );
}
