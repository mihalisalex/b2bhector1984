/**
 * The "+VAT" marker appended after a net price wherever one is shown —
 * catalogue cards, product page, quick-order linesheet, cart lines. Renders
 * nothing when the style's VAT rate is 0 (or unset), so a product genuinely
 * exempt from VAT doesn't carry a misleading label.
 *
 * Deliberately just a static "+VAT" rather than the actual percentage or
 * computed amount — this sits next to a *unit* price (per pair), and showing
 * "+VAT" there is a hint that tax applies, not a place to do the arithmetic;
 * the real Subtotal/VAT/Total breakdown belongs at the order-total level
 * (cart, checkout, invoice, order detail), where it already exists.
 */
export function VatSuffix({ vatRate, className }: { vatRate: number | undefined; className?: string }) {
  if (!vatRate) return null;
  return <span className={className ?? "text-ink-soft"}>&nbsp;+VAT</span>;
}

/** Plain-text equivalent for non-JSX contexts (CSV export, PDF). */
export function vatSuffixText(vatRate: number | undefined): string {
  return vatRate ? " +VAT" : "";
}
