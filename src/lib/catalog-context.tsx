"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { buildSkuIndex, type SkuMatch } from "@/lib/skuIndex";
import type { Style } from "@/lib/types";

interface CatalogContextValue {
  styles: Style[];
  getStyleById: (id: string) => Style | undefined;
  getStyleBySlug: (slug: string) => Style | undefined;
  lookupSku: (raw: string) => SkuMatch | null;
  allSkus: () => SkuMatch[];
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ styles, children }: { styles: Style[]; children: ReactNode }) {
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
    };
  }, [styles]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used within a CatalogProvider");
  return ctx;
}
