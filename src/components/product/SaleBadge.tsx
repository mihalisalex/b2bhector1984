import { getEffectiveBasePrice, isOnSale } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import type { Style } from "@/lib/types";

/**
 * The discount flag shown on product cards, in burgundy (the promotional accent — not
 * --color-ember, which reads as danger everywhere else in this app).
 *
 * Shows the percentage, not the price. That's what makes it safe to render on /collections,
 * which is public: a signed-out visitor learns there's 10% off without ever seeing a trade
 * price, which is the whole point — it's a reason to apply for an account rather than a
 * pricing leak.
 *
 * Derives the percentage from the live sale price through `isOnSale`/`getEffectiveBasePrice`,
 * so it respects scheduled sale windows and vanishes by itself when a sale ends. Nothing here
 * is hardcoded, so it can't advertise a discount that isn't actually in effect.
 */
export function SaleBadge({ style, className }: { style: Style; className?: string }) {
  if (!isOnSale(style)) return null;
  const percent = Math.round((1 - getEffectiveBasePrice(style) / style.basePrice) * 100);
  if (percent <= 0) return null;

  return (
    <span
      className={cn(
        "bg-burgundy px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white",
        className,
      )}
    >
      {/* Minus sign (U+2212), not a hyphen — it's a number here, and the hyphen reads as a
          dash at this size. */}
      −{percent}% Sale
    </span>
  );
}
