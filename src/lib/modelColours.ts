import type { Style } from "@/lib/types";

/**
 * Each colour of a shoe is its own product (5109 Brown is 5109-1, 5109 Black is 5109-2), and
 * the owner wants it to stay that way in the catalogue — both cards visible (2026-09-25). On
 * the product page, though, a buyer looking at the brown one should be able to jump to the
 * black one. This finds those siblings.
 *
 * The model is the first word of the product name: every name starts with it ("5109 Brown
 * - …", "1013 - Black …", "692 Tan Brown - …", "YKT09 Black - …"), including the ones whose
 * style numbers don't share a prefix (1013 / 10131 / 10133, 6921 / 6922, 5101 / 51012).
 */
export function modelCode(style: Pick<Style, "name" | "styleNumber">): string {
  const first = style.name.trim().split(/\s+/)[0];
  return (first || style.styleNumber.split("-")[0]).toUpperCase();
}

/** All products of the same model, this one included, in style-number order. */
export function modelSiblings(style: Style, all: Style[]): Style[] {
  const code = modelCode(style);
  return all
    .filter((s) => modelCode(s) === code)
    .sort((a, b) => a.styleNumber.localeCompare(b.styleNumber, "en", { numeric: true }));
}

/**
 * How a shoe is named on the page: "5109 Brown", with its type shown beside it in the reader's
 * language. Colour names stay in English on every site (owner's decision); the raw product
 * name ("5109 Brown - Leather formal boots") stays the record for orders and search engines.
 */
export function styleTitle(style: Pick<Style, "name" | "styleNumber" | "colorways">): string {
  const colour = (style.colorways[0]?.name ?? "")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase());
  return `${modelCode(style)} ${colour}`.trim();
}
