"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { buildSkuIndex, type SkuMatch } from "@/lib/skuIndex";
import type { Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";

interface CatalogContextValue {
  styles: Style[];
  getStyleById: (id: string) => Style | undefined;
  getStyleBySlug: (slug: string) => Style | undefined;
  lookupSku: (raw: string) => SkuMatch | null;
  allSkus: () => SkuMatch[];
  /** Site-wide "production upon request" lead time in days — shared here rather than
   * prop-drilled through every ordering component (PrimaryPurchasePanel, QuickAdd,
   * OrderableLinesheet, CheckoutForm) that needs it. */
  productionLeadTimeDays: number;
  /** styleId -> on-hand stock, for every storefront style — lets CheckoutForm preview which
   * cart lines will resolve to "production" without a page-specific inventory fetch. This
   * is a preview only; the authoritative per-line decision is still made server-side in
   * `placeOrder()`'s atomic stock check. */
  inventory: Record<string, StyleInventory>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  styles,
  productionLeadTimeDays,
  inventory,
  children,
}: {
  styles: Style[];
  productionLeadTimeDays: number;
  inventory: Record<string, StyleInventory>;
  children: ReactNode;
}) {
  const value = useMemo<CatalogContextValue>(() => {
    const byId = new Map(styles.map((s) => [s.id, s]));
    const bySlug = new Map(styles.map((s) => [s.slug, s]));
    const skuIndex = buildSkuIndex(styles);

    return {
      styles,
      getStyleById: (id) => byId.get(id),
      getStyleBySlug: (slug) => bySlug.get(slug),
      lookupSku: (raw) => skuIndex.get(raw.trim().toUpperCase()) ?? null,
      allSkus: () => Array.from(skuIndex.values()),
      productionLeadTimeDays,
      inventory,
    };
  }, [styles, productionLeadTimeDays, inventory]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within a CatalogProvider");
  return ctx;
}
