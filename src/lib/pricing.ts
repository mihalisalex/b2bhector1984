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

/** Final per-pair wholesale price for a style at the given payment terms. */
export function getUnitPrice(style: Style, terms: CreditTerms): number {
  return round2(style.basePrice * (1 - TERMS_DISCOUNT[terms]));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatEUR(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "EUR" });
}

/** Total order value, boxes, and pairs — order lines store per-box qty and per-pair price. */
export function summarizeOrder(order: { lines: Order["lines"] }): { total: number; totalBoxes: number; totalPairs: number } {
  let total = 0;
  let totalBoxes = 0;
  let totalPairs = 0;
  for (const line of order.lines) {
    const pairs = line.qty * getBoxType(line.boxTypeId).totalPairs;
    total += pairs * line.unitPrice;
    totalBoxes += line.qty;
    totalPairs += pairs;
  }
  return { total: round2(total), totalBoxes, totalPairs };
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
): MatrixValidation {
  let totalPairs = 0;
  let totalBoxes = 0;
  for (const colorway of style.colorways) {
    const boxes = boxQuantities[colorway.id] ?? {};
    totalPairs += getTotalPairs(boxes);
    totalBoxes += getTotalBoxes(boxes);
  }

  const unitPrice = getUnitPrice(style, terms);
  const subtotal = round2(unitPrice * totalPairs);

  return { totalPairs, totalBoxes, subtotal, unitPrice };
}
