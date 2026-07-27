import { getTier } from "@/lib/data/pricingTiers";
import { getBoxType, getTotalBoxes, getTotalPairs } from "@/lib/data/boxTypes";
import type { BoxTypeId, Order, PricingTierId, Style } from "@/lib/types";

/** Break multiplier that applies at a given total-pair quantity for a style. */
export function getBreakMultiplier(style: Style, pairs: number): number {
  let multiplier = style.priceBreaks[0]?.multiplier ?? 1;
  for (const brk of style.priceBreaks) {
    if (pairs >= brk.minUnits) multiplier = brk.multiplier;
  }
  return multiplier;
}

/** Final per-pair wholesale price for a style at a given tier and order quantity (in pairs). */
export function getUnitPrice(style: Style, tierId: PricingTierId, pairs: number): number {
  const tier = getTier(tierId);
  const breakMultiplier = getBreakMultiplier(style, Math.max(pairs, 1));
  return round2(style.basePrice * breakMultiplier * tier.priceMultiplier);
}

/** Displayable price-break table (per-pair price per break, at this tier). */
export function getPriceBreakTable(style: Style, tierId: PricingTierId) {
  const tier = getTier(tierId);
  return style.priceBreaks.map((brk, i) => {
    const next = style.priceBreaks[i + 1];
    return {
      label: next ? `${brk.minUnits}–${next.minUnits - 1}` : `${brk.minUnits}+`,
      minUnits: brk.minUnits,
      price: round2(style.basePrice * brk.multiplier * tier.priceMultiplier),
    };
  });
}

/** Minimum order quantity for a style, in boxes, at a given tier. */
export function getMoqBoxesForTier(style: Style, tierId: PricingTierId): number {
  const tier = getTier(tierId);
  return Math.max(1, Math.round(style.moqBoxes * tier.moqMultiplier));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatUSD(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Total order value, boxes, and pairs — order lines store per-box qty and per-pair price. */
export function summarizeOrder(order: Order): { total: number; totalBoxes: number; totalPairs: number } {
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

export interface MatrixValidation {
  totalPairs: number;
  totalBoxes: number;
  subtotal: number;
  unitPrice: number;
  moqBoxes: number;
  moqMet: boolean;
  orderError?: string;
}

/**
 * boxQuantities: colorwayId -> boxTypeId -> qty (number of boxes)
 */
export function validateMatrix(
  style: Style,
  tierId: PricingTierId,
  boxQuantities: Record<string, Partial<Record<BoxTypeId, number>>>,
): MatrixValidation {
  const moqBoxes = getMoqBoxesForTier(style, tierId);

  let totalPairs = 0;
  let totalBoxes = 0;
  for (const colorway of style.colorways) {
    const boxes = boxQuantities[colorway.id] ?? {};
    totalPairs += getTotalPairs(boxes);
    totalBoxes += getTotalBoxes(boxes);
  }

  const unitPrice = getUnitPrice(style, tierId, totalPairs);
  const subtotal = round2(unitPrice * totalPairs);
  const moqMet = totalBoxes >= moqBoxes;

  return {
    totalPairs,
    totalBoxes,
    subtotal,
    unitPrice,
    moqBoxes,
    moqMet,
    orderError:
      totalBoxes > 0 && !moqMet
        ? `This style requires a minimum of ${moqBoxes} box${moqBoxes > 1 ? "es" : ""} per order. Add ${moqBoxes - totalBoxes} more.`
        : undefined,
  };
}
