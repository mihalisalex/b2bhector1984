import { STYLES } from "@/lib/data/styles";
import type { Colorway, Style } from "@/lib/types";

export interface SkuMatch {
  style: Style;
  colorway: Colorway;
  sku: string;
}

let index: Map<string, SkuMatch> | null = null;

function buildIndex(): Map<string, SkuMatch> {
  const map = new Map<string, SkuMatch>();
  for (const style of STYLES) {
    for (const colorway of style.colorways) {
      const sku = `${style.styleNumber}-${colorway.skuSuffix}`;
      map.set(sku.toUpperCase(), { style, colorway, sku });
    }
  }
  return map;
}

export function lookupSku(raw: string): SkuMatch | null {
  if (!index) index = buildIndex();
  return index.get(raw.trim().toUpperCase()) ?? null;
}

export function allSkus(): SkuMatch[] {
  if (!index) index = buildIndex();
  return Array.from(index.values());
}
