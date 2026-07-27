import type { Colorway, Style } from "@/lib/types";

export interface SkuMatch {
  style: Style;
  colorway: Colorway;
  sku: string;
}

export function buildSkuIndex(styles: Style[]): Map<string, SkuMatch> {
  const map = new Map<string, SkuMatch>();
  for (const style of styles) {
    for (const colorway of style.colorways) {
      const sku = `${style.styleNumber}-${colorway.skuSuffix}`;
      map.set(sku.toUpperCase(), { style, colorway, sku });
    }
  }
  return map;
}
