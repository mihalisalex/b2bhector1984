import { modelCode } from "@/lib/modelColours";
import type { Category, Style } from "@/lib/types";

/** The order the catalogue reads in, heaviest shoes first. */
const CATEGORY_ORDER: Category[] = ["boots", "formal", "wedding", "loafers", "sneakers", "anatomic", "sandals"];

/** Puts the colours of one model side by side, keeping the models in the order given. */
function modelsTogether(styles: Style[]): Style[] {
  const byModel = new Map<string, Style[]>();
  for (const style of styles) {
    const code = modelCode(style);
    byModel.set(code, [...(byModel.get(code) ?? []), style]);
  }
  return [...byModel.values()].flat();
}

/** The catalogue as chapters, one per category that has anything in it. */
export function groupByCategory(styles: Style[]): { category: Category; styles: Style[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    styles: modelsTogether(styles.filter((s) => s.category === category)),
  })).filter((group) => group.styles.length > 0);
}

/** How many styles each category holds, in catalogue order. */
export function categoryCounts(styles: Style[]): { value: Category; count: number }[] {
  return groupByCategory(styles).map((group) => ({ value: group.category, count: group.styles.length }));
}
