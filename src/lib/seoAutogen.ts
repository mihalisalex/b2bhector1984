/**
 * Automatic SEO copy generation.
 *
 * Deliberately dependency-free and free of any `server-only` import: the admin
 * SEO tab renders a *live* SERP preview as the user types, which means the
 * browser has to be able to run exactly the same generator the server will use
 * when a field is left blank. Any divergence between the two would show the
 * admin one thing and ship another.
 *
 * The rule everywhere below is "generate, never overwrite" — a generated value
 * is only ever a fallback for an empty field, and the admin's own text always
 * wins. `resolveWithSource` exists so the UI can honestly label which of the
 * two the user is looking at.
 */

/** Google truncates the SERP title around 60 characters and the snippet around 155. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;
export const TITLE_MIN = 30;
export const DESCRIPTION_MIN = 70;

/**
 * Truncates on a word boundary and appends an ellipsis, so a generated
 * description never ends mid-word. Returns the input untouched when it already
 * fits — the common case, and worth not allocating for.
 */
export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[,;:\-–—]$/, "")}…`;
}

/** Strips HTML so a rich-text product description can seed a meta description. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export interface ProductSeoSource {
  name: string;
  styleNumber?: string;
  category: string;
  season?: string;
  tagline?: string;
  description?: string;
  brandName?: string;
  materials?: string[];
  tags?: string[];
  colorwayNames?: string[];
}

/**
 * "Hector Boat Loafer — Loafers | Hector Footwear"
 *
 * Brand goes last: Google truncates from the right, and the distinguishing
 * part of a wholesale product title is the style name, not the house name that
 * repeats on every page.
 */
export function generateProductTitle(product: ProductSeoSource, siteName: string): string {
  const brand = product.brandName?.trim() || siteName;
  const category = titleCase(product.category);
  const base = `${product.name} — ${category}`;
  const withBrand = `${base} | ${brand}`;
  // Prefer the fuller form, but drop the brand rather than truncate the name.
  return withBrand.length <= TITLE_MAX ? withBrand : truncate(base, TITLE_MAX);
}

/**
 * Prefers the human-written tagline, falls back to the body description, and
 * only then synthesises one from the product's attributes. Always ends up
 * inside Google's snippet budget.
 */
export function generateProductDescription(product: ProductSeoSource): string {
  const tagline = product.tagline?.trim();
  const body = product.description ? stripHtml(product.description) : "";

  if (tagline && tagline.length >= DESCRIPTION_MIN) return truncate(tagline, DESCRIPTION_MAX);
  if (tagline && body) return truncate(`${tagline} ${body}`, DESCRIPTION_MAX);
  if (tagline) {
    const materials = product.materials?.length ? ` ${product.materials.slice(0, 2).join(" and ")}.` : "";
    return truncate(`${tagline}${materials} Available for wholesale ordering.`, DESCRIPTION_MAX);
  }
  if (body.length >= DESCRIPTION_MIN) return truncate(body, DESCRIPTION_MAX);

  const parts = [
    product.name,
    product.materials?.length ? `in ${product.materials.slice(0, 2).join(" and ")}` : "",
    product.season ? `for the ${product.season} collection` : "",
  ].filter(Boolean);
  return truncate(`${parts.join(" ")}. Wholesale ordering by the box, trade terms available.`, DESCRIPTION_MAX);
}

/**
 * The single term the page is optimised for. Falls back to the most specific
 * thing we know — the product name plus its category reads far more like a
 * real search query than either alone.
 */
export function generateFocusKeyword(product: ProductSeoSource): string {
  return `${product.name} ${titleCase(product.category)}`.toLowerCase();
}

export function generateSecondaryKeywords(product: ProductSeoSource): string[] {
  const candidates = [
    product.category,
    product.season,
    product.brandName,
    ...(product.materials ?? []),
    ...(product.tags ?? []),
    "wholesale footwear",
    "trade pricing",
  ];
  return Array.from(
    new Set(
      candidates
        .filter((c): c is string => Boolean(c && c.trim()))
        .map((c) => c.trim().toLowerCase()),
    ),
  ).slice(0, 10);
}

/**
 * Alt text for a product photo. Colourway matters more than any adjective —
 * it is the one thing that distinguishes one shot of a style from another,
 * and it is what a buyer would actually say out loud.
 */
export function generateImageAltText(product: { name: string; category: string }, colorwayName?: string): string {
  const base = colorwayName ? `${product.name} in ${colorwayName}` : product.name;
  return truncate(`${base} — ${titleCase(product.category)}`, 125);
}

/**
 * Slugifier for SEO surfaces. Separate from `src/lib/slug.ts` (which the
 * product creation flow uses) because this one also strips diacritics and
 * stopwords — a slug is one of the few places where "the" and "and" are pure
 * noise, and product names here are frequently accented.
 */
const STOPWORDS = new Set(["a", "an", "the", "and", "or", "of", "for", "with", "in", "on", "to"]);

export function slugifyForSeo(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .split(/[\s-]+/)
    .filter((word, index, all) => word && (all.length <= 3 || !STOPWORDS.has(word)))
    .join("-")
    .slice(0, 75)
    .replace(/^-+|-+$/g, "");
}

export interface Resolved {
  value: string;
  /** `manual` when an admin typed it, `auto` when this module generated it. */
  source: "manual" | "auto";
}

export function resolveWithSource(manual: string | undefined, generated: string): Resolved {
  const trimmed = manual?.trim();
  return trimmed ? { value: trimmed, source: "manual" } : { value: generated, source: "auto" };
}

/**
 * Length grading for the admin's field meters. "warn" means it still works but
 * Google is likely to truncate or ignore it; "bad" means it's outright missing.
 */
export type LengthGrade = "good" | "warn" | "bad";

export function gradeLength(value: string, min: number, max: number): LengthGrade {
  const length = value.trim().length;
  if (length === 0) return "bad";
  if (length < min || length > max) return "warn";
  return "good";
}

/** Whether the focus keyword actually appears in the copy meant to rank for it. */
export function containsKeyword(text: string, keyword: string): boolean {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return false;
  return text.toLowerCase().includes(needle);
}

export interface ArticleSeoSource {
  title: string;
  excerpt?: string;
  contentHtml?: string;
  category: string;
  siteName: string;
}

/** "How to Find Reliable Suppliers | Journal | Hector Footwear" — same right-truncation
 * logic as generateProductTitle: the distinguishing part (the headline) comes first,
 * the repeated site furniture is what gets dropped if the full form runs long. */
export function generateArticleTitle(source: ArticleSeoSource): string {
  const withSite = `${source.title} | Journal | ${source.siteName}`;
  if (withSite.length <= TITLE_MAX) return withSite;
  const withJournal = `${source.title} | Journal`;
  return withJournal.length <= TITLE_MAX ? withJournal : truncate(source.title, TITLE_MAX);
}

/** Prefers the human-written excerpt, falls back to the stripped article body. */
export function generateArticleDescription(source: ArticleSeoSource): string {
  const excerpt = source.excerpt?.trim();
  if (excerpt && excerpt.length >= DESCRIPTION_MIN) return truncate(excerpt, DESCRIPTION_MAX);
  const body = source.contentHtml ? stripHtml(source.contentHtml) : "";
  if (excerpt && body) return truncate(`${excerpt} ${body}`, DESCRIPTION_MAX);
  if (body.length >= DESCRIPTION_MIN) return truncate(body, DESCRIPTION_MAX);
  return truncate(`${source.title} — ${source.category} insights from ${source.siteName}.`, DESCRIPTION_MAX);
}
