"use client";

import { useBuyerTerms } from "@/lib/cart-context";
import { useFormat } from "@/i18n/I18nProvider";
import { getUnitPrice } from "@/lib/pricing";
import type { Style } from "@/lib/types";

/**
 * A price at the buyer's chosen payment terms, for server-rendered rows that can't read the
 * cart context themselves. `pairs` > 1 prices a whole box.
 */
export function BuyerPrice({ style, priceMultiplier = 1, pairs = 1 }: { style: Style; priceMultiplier?: number; pairs?: number }) {
  const terms = useBuyerTerms();
  const { eur } = useFormat();
  return <>{eur(getUnitPrice(style, terms, priceMultiplier) * pairs)}</>;
}
