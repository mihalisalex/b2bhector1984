import { getBoxType, getTotalBoxes, getTotalPairs } from "@/lib/data/boxTypes";
import type { BoxTypeId, CreditTerms, Order, Style } from "@/lib/types";

/** Payment-terms discount off a style's base price — the only lever on wholesale price. */
export const TERMS_DISCOUNT: Record<CreditTerms, number> = {
  prepay: 0.1,
  net30: 0.05,
  net60: 0,
};

export const TERMS_LABEL: Record<CreditTerms, string> = {
  prepay: "Prepay",
  net30: "Net 30",
  net60: "Net 60",
};

/**
 * `basePrice`, discounted to `salePrice` when a scheduled sale is currently
 * active (both bounds optional/open-ended — set either, both, or neither).
 * This is the one place discount scheduling actually affects a real price;
 * everything downstream (getUnitPrice, validateMatrix, catalog/cart/checkout)
 * reads through this rather than `style.basePrice` directly.
 */
export function getEffectiveBasePrice(style: Style, now: Date = new Date()): number {
  if (style.salePrice == null) return style.basePrice;
  const start = style.saleStartAt ? new Date(style.saleStartAt) : undefined;
  const end = style.saleEndAt ? new Date(style.saleEndAt) : undefined;
  if (start && now < start) return style.basePrice;
  if (end && now > end) return style.basePrice;
  return style.salePrice;
}

/** Whether a scheduled sale is currently active — the one check every "Sale" badge across
 * the storefront (cards, list rows, the product page, the quick-order linesheet) should use,
 * rather than each re-deriving `getEffectiveBasePrice(style) < style.basePrice` inline. */
export function isOnSale(style: Style, now: Date = new Date()): boolean {
  return getEffectiveBasePrice(style, now) < style.basePrice;
}

/**
 * Final per-pair wholesale price for a style at the given payment terms.
 * `priceMultiplier` is an optional per-account negotiated-pricing lever
 * (`accounts.price_multiplier`, defaults to 1 for every account) — applied
 * on top of the terms discount, not instead of it.
 */
export function getUnitPrice(style: Style, terms: CreditTerms, priceMultiplier = 1): number {
  return round2(getEffectiveBasePrice(style) * (1 - TERMS_DISCOUNT[terms]) * priceMultiplier);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatEUR(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "EUR" });
}

/** Total order value, boxes, and pairs — order lines store per-box qty and per-pair price. */
/**
 * `total` is the net (pre-VAT) amount — its meaning is unchanged from before
 * VAT existed, so every existing caller that destructures just `{ total }`
 * keeps working exactly as it did. `vatTotal`/`grandTotal` are additive: VAT
 * is charged on top of list prices (the standard EU B2B convention), computed
 * per line from `line.vatRate` — captured at order-placement time, not looked
 * up live, so a later change to a product's VAT rate never rewrites the tax
 * on an order that already exists. Lines with no stored rate (every order
 * placed before this existed) contribute 0 VAT, so grandTotal === total for
 * them — numerically unchanged, not retroactively taxed.
 */
export function summarizeOrder(order: {
  lines: Order["lines"];
}): { total: number; vatTotal: number; grandTotal: number; totalBoxes: number; totalPairs: number } {
  let total = 0;
  let vatTotal = 0;
  let totalBoxes = 0;
  let totalPairs = 0;
  for (const line of order.lines) {
    const pairs = line.qty * getBoxType(line.boxTypeId).totalPairs;
    const lineTotal = pairs * line.unitPrice;
    total += lineTotal;
    vatTotal += lineTotal * (line.vatRate ?? 0);
    totalBoxes += line.qty;
    totalPairs += pairs;
  }
  const roundedTotal = round2(total);
  const roundedVat = round2(vatTotal);
  return { total: roundedTotal, vatTotal: roundedVat, grandTotal: round2(roundedTotal + roundedVat), totalBoxes, totalPairs };
}

/** The only minimum that applies — no more per-style box minimums. */
export const MIN_ORDER_PAIRS = 40;

export function getOrderMinimumError(totalPairs: number): string | undefined {
  if (totalPairs === 0 || totalPairs >= MIN_ORDER_PAIRS) return undefined;
  return `Orders require a minimum of ${MIN_ORDER_PAIRS} pairs total. Add ${MIN_ORDER_PAIRS - totalPairs} more pairs to check out.`;
}

export interface MatrixValidation {
  totalPairs: number;
  totalBoxes: number;
  subtotal: number;
  unitPrice: number;
}

/**
 * boxQuantities: colorwayId -> boxTypeId -> qty (number of boxes)
 * `terms` defaults to net60 (list price) for pre-checkout screens, where the
 * buyer hasn't chosen payment terms yet — checkout recomputes with the terms
 * they actually select.
 */
export function validateMatrix(
  style: Style,
  boxQuantities: Record<string, Partial<Record<BoxTypeId, number>>>,
  terms: CreditTerms = "net60",
  priceMultiplier = 1,
): MatrixValidation {
  let totalPairs = 0;
  let totalBoxes = 0;
  for (const colorway of style.colorways) {
    const boxes = boxQuantities[colorway.id] ?? {};
    totalPairs += getTotalPairs(boxes);
    totalBoxes += getTotalBoxes(boxes);
  }

  const unitPrice = getUnitPrice(style, terms, priceMultiplier);
  const subtotal = round2(unitPrice * totalPairs);

  return { totalPairs, totalBoxes, subtotal, unitPrice };
}
