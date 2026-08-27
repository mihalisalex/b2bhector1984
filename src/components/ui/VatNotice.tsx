import { commonVatRate, DEFAULT_VAT_RATE, vatPercent } from "@/lib/tax";
import { t } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * The persistent "prices are net" line, for every surface that shows a price.
 *
 * Distinct from `VatSuffix`, and both are wanted. `VatSuffix` puts a terse "+VAT" beside a
 * single unit price — a hint, at the point of reading a number. This states the rule for
 * the whole page, in full, with the percentage: a buyer scanning a catalogue must not be
 * able to leave thinking a displayed figure is what they will be invoiced.
 *
 * `rates` is the VAT rate of each priced item on the page. When they agree (the normal
 * case — the whole catalogue sits at the standard rate) the percentage is stated outright.
 * When they genuinely differ, quoting one number would be false, so the wording falls back
 * to the rate-free form rather than picking a winner.
 */
export function VatNotice({
  dict,
  rates,
  className,
}: {
  dict: Dictionary;
  /** Per-item VAT rates on this page. Omit to state the standard rate. */
  rates?: readonly (number | undefined)[];
  className?: string;
}) {
  const rate = rates ? commonVatRate(rates) : DEFAULT_VAT_RATE;

  return (
    <p className={className ?? "text-xs text-ink-soft"}>
      {rate === null
        ? dict.tax.vatExcludedMixed
        : t(dict.tax.vatExcludedNotice, { rate: vatPercent(rate) })}
    </p>
  );
}

/** Plain-text equivalent for PDF and email, which cannot render JSX. */
export function vatNoticeText(dict: Dictionary, rates?: readonly (number | undefined)[]): string {
  const rate = rates ? commonVatRate(rates) : DEFAULT_VAT_RATE;
  return rate === null ? dict.tax.vatExcludedMixed : t(dict.tax.vatExcludedNotice, { rate: vatPercent(rate) });
}
