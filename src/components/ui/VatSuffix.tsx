"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { useChargesVat } from "@/lib/cart-context";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * The "+VAT" marker appended after a net price wherever one is shown —
 * catalogue cards, product page, quick-order linesheet, cart lines. Renders
 * nothing when the style's VAT rate is 0 (or unset), so a product genuinely
 * exempt from VAT doesn't carry a misleading label.
 *
 * Deliberately just a static marker rather than the actual percentage or
 * computed amount — this sits next to a *unit* price (per pair), and showing
 * "+VAT" there is a hint that tax applies, not a place to do the arithmetic;
 * the real Subtotal/VAT/Total breakdown belongs at the order-total level
 * (cart, checkout, invoice, order detail), where it already exists.
 *
 * Client component for the same reason AvailabilityBadge is: it renders in
 * seven places across server and client trees, and threading a dict prop
 * through all of them for one word was the worse trade.
 */
export function VatSuffix({ vatRate, className }: { vatRate: number | undefined; className?: string }) {
  const { dict } = useI18n();
  // A buyer outside Greece pays no Greek VAT, so "+VAT" would be wrong for them.
  const chargesVat = useChargesVat();
  if (!vatRate || !chargesVat) return null;
  return <span className={className ?? "text-ink-soft"}>&nbsp;{dict.tax.vatSuffix}</span>;
}

/** Plain-text equivalent for non-JSX contexts (CSV export, PDF). */
export function vatSuffixText(vatRate: number | undefined, dict: Dictionary): string {
  return vatRate ? ` ${dict.tax.vatSuffix}` : "";
}
