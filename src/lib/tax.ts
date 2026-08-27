/**
 * Greek VAT disclosure and company tax identity.
 *
 * Read this before adding a VAT rate anywhere: **this module does not own the rate used to
 * compute tax.** That already exists and is better than a constant would be.
 *
 *   styles.vat_rate       (migration 0014, default 0.24) — per style
 *   order_lines.vat_rate  (migration 0026, default 0)    — captured at placement time
 *   summarizeOrder()      (src/lib/pricing.ts)           — sums per line, never live
 *
 * Capturing the rate per order line is what makes a past invoice reproducible: if Greece
 * moves the standard rate, or a style's rate is corrected, an order already placed must
 * still compute the tax it actually charged. A single global constant would silently
 * rewrite the VAT on every historical order the moment it changed. Do not "simplify" the
 * per-line rate into a constant.
 *
 * What this module owns is the *disclosure* — the plain statement that the prices on screen
 * are net. Wholesale prices here are quoted EXCLUDING VAT, standard Greek B2B practice: a
 * retailer deducts input VAT and needs the net figure to work out their margin. That makes
 * the exclusion something the buyer must not be able to miss, and until now the only signal
 * was a terse "+VAT" next to unit prices (see VatSuffix, whose own doc comment says it
 * deliberately avoids stating a percentage).
 */

/**
 * The rate to quote in disclosure copy when no more specific rate is in hand.
 *
 * Must match the `styles.vat_rate` column default in migration 0014. It is the Greek
 * standard rate; Crete is not in the reduced-rate Aegean islands scheme, so it applies to
 * every order this business ships. This is a *display* default only — nothing computes tax
 * from it.
 */
export const DEFAULT_VAT_RATE = 0.24;

/** A rate as a whole number, for interpolation into copy ("ΦΠΑ 24%"). */
export function vatPercent(rate: number = DEFAULT_VAT_RATE): number {
  return Math.round(rate * 100);
}

/**
 * The single rate to quote for a set of priced items, or the default when they disagree.
 *
 * Every style carries its own rate, so in principle a page can show items at two rates and
 * a single "excluding 24% VAT" line would be a lie. In practice the whole catalogue sits at
 * the 0.24 default — but "in practice" is not a guarantee, so this checks rather than
 * assumes. When rates genuinely differ the caller should fall back to a rate-free wording;
 * `null` is that signal.
 */
export function commonVatRate(rates: readonly (number | undefined)[]): number | null {
  const present = rates.filter((r): r is number => typeof r === "number" && r > 0);
  if (present.length === 0) return null;
  const first = present[0];
  return present.every((r) => r === first) ? first : null;
}

// ---------------------------------------------------------------------------
// Company tax identity
// ---------------------------------------------------------------------------

/**
 * Placeholder for an unsupplied tax value.
 *
 * Written to be *visibly* wrong rather than plausibly wrong. A blank field or a
 * realistic-looking dummy ΑΦΜ on an invoice ships unnoticed, and an invoice without a
 * correct ΑΦΜ is not usable for a Greek retailer's own bookkeeping — which makes it worse
 * than no invoice, because it looks fine until their accountant rejects it.
 */
export const TAX_IDENTITY_PLACEHOLDER = "«TODO»";

export interface TaxIdentity {
  /** ΑΦΜ — Greek tax registration number. */
  afm: string;
  /** ΔΟΥ — competent tax office. */
  doy: string;
  /** EU VAT number: "EL" followed by the ΑΦΜ. */
  euVatId: string;
  /** True while any value is still a placeholder. Surfaced in the pre-launch checklist. */
  incomplete: boolean;
}

/**
 * Resolves tax identity from `seo_settings` (columns added in migration 0037), falling back
 * to visible placeholders. Stored rather than hardcoded so the owner can supply the real
 * values without a deploy.
 */
export function resolveTaxIdentity(input?: {
  afm?: string | null;
  doy?: string | null;
  euVatId?: string | null;
}): TaxIdentity {
  const afm = input?.afm?.trim() || TAX_IDENTITY_PLACEHOLDER;
  const doy = input?.doy?.trim() || TAX_IDENTITY_PLACEHOLDER;

  /**
   * NOT derived from the ΑΦΜ. An earlier version of this filled it in as `EL${afm}`, on the
   * reasoning that the EU form is just the prefix plus the number.
   *
   * That is the right *format* but the wrong *claim*. A Greek business only holds an EU VAT
   * number once it is registered in VIES; printing EL+ΑΦΜ on an invoice for a business that
   * isn't asserts a registration that may not exist, and a customer's accountant can check
   * it in VIES in seconds. The owner has confirmed there is no EU VAT number, so this stays
   * empty and the invoice simply omits the line rather than inventing one.
   */
  const euVatId = input?.euVatId?.trim() || "";

  return {
    afm,
    doy,
    euVatId,
    // `euVatId` is deliberately NOT part of this: an absent EU VAT number is a settled fact
    // here, not an outstanding to-do, and flagging it would keep the pre-launch checklist
    // permanently red.
    incomplete: [afm, doy].some((v) => v === TAX_IDENTITY_PLACEHOLDER),
  };
}

/**
 * NOT IMPLEMENTED, deliberately — noted as a follow-up per the owner's instruction.
 *
 * EU reverse-charge invoices a VAT-registered buyer in another member state at 0% with the
 * liability shifted to them, which requires validating their VAT number against VIES at
 * order time and storing the outcome. That is separate work with its own failure modes
 * (VIES is frequently down, and a failed lookup must not block an order). Until it exists,
 * every order is invoiced at the Greek domestic rate on the line.
 */
