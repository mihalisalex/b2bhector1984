import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAllStyles } from "@/lib/data/styles";
import { createBrand, getAllBrands } from "@/lib/data/brands";
import { sanitizeProductDescription } from "@/lib/sanitizeHtml";
import type { Category, Gender, StyleSeason } from "@/lib/types";

const CATEGORIES: Category[] = ["loafers", "wedding", "sneakers", "sandals", "boots", "formal", "anatomic"];
const SEASONS: StyleSeason[] = ["summer", "winter", "both"];
const GENDERS: Gender[] = ["mens", "womens", "unisex"];

export interface ImportRow {
  styleNumber: string;
  name: string;
  category?: string;
  season?: string;
  gender?: string;
  tagline?: string;
  description?: string;
  /**
   * Greek copy (migration 0037). This is the return leg of the "Greek copy CSV" export on
   * the product list — the owner writes the translations in a spreadsheet and imports the
   * same file back, so the column names here match that export's headers exactly.
   *
   * `materialsEl` is pipe-separated to match how the export writes it; a comma would fight
   * with the CSV itself and a Greek materials list ("Δέρμα, φυσικό") legitimately contains
   * commas.
   */
  taglineEl?: string;
  descriptionEl?: string;
  materialsEl?: string;
  lastNoteEl?: string;
  basePrice?: string;
  msrp?: string;
  costPrice?: string;
  brandName?: string;
  tags?: string;
}

export interface ImportRowResult {
  row: number;
  styleNumber: string;
  action: "created" | "updated" | "error";
  errors: string[];
}

function validateRow(row: ImportRow): string[] {
  const errors: string[] = [];
  if (!row.styleNumber?.trim()) errors.push("Style number is required.");
  if (!row.name?.trim()) errors.push("Name is required.");
  if (row.category && !CATEGORIES.includes(row.category as Category)) errors.push(`Unknown category "${row.category}".`);
  if (row.season && !SEASONS.includes(row.season as StyleSeason)) errors.push(`Unknown season "${row.season}".`);
  if (row.gender && !GENDERS.includes(row.gender as Gender)) errors.push(`Unknown gender "${row.gender}".`);
  if (row.basePrice && !Number.isFinite(Number(row.basePrice))) errors.push(`Wholesale price "${row.basePrice}" isn't a number.`);
  if (row.msrp && !Number.isFinite(Number(row.msrp))) errors.push(`MSRP "${row.msrp}" isn't a number.`);
  if (row.costPrice && !Number.isFinite(Number(row.costPrice))) errors.push(`Cost price "${row.costPrice}" isn't a number.`);
  return errors;
}

export interface ImportRowPreview {
  row: number;
  styleNumber: string;
  errors: string[];
  action: "create" | "update";
  /** Set when `action` is "update" — the name of the existing product this row will overwrite. */
  existingName?: string;
}

/** Validates every row and, by matching style numbers against the live catalog, previews
 * whether each will create a new product or overwrite an existing one — without writing
 * anything. Used for the import wizard's preview step, so a style-number typo colliding
 * with an existing SKU is visible before commit, not discovered after. */
export async function validateImportRows(rows: ImportRow[]): Promise<ImportRowPreview[]> {
  const existing = await getAllStyles();
  const byStyleNumber = new Map(existing.map((s) => [s.styleNumber, s]));
  return rows.map((row, i) => {
    const match = byStyleNumber.get(row.styleNumber?.trim() ?? "");
    return {
      row: i + 1,
      styleNumber: row.styleNumber,
      errors: validateRow(row),
      action: match ? "update" : "create",
      existingName: match?.name,
    };
  });
}

/**
 * Creates or updates (matched by style number) one product per valid row.
 * Rows that fail validation are skipped and reported, not partially applied.
 */
export async function importProductRows(rows: ImportRow[]): Promise<ImportRowResult[]> {
  const existing = await getAllStyles();
  const byStyleNumber = new Map(existing.map((s) => [s.styleNumber, s]));
  const brands = await getAllBrands();
  const brandByName = new Map(brands.map((b) => [b.name.toLowerCase(), b.id]));

  const results: ImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const errors = validateRow(row);
    if (errors.length > 0) {
      results.push({ row: i + 1, styleNumber: row.styleNumber, action: "error", errors });
      continue;
    }

    let brandId: string | undefined;
    if (row.brandName?.trim()) {
      const key = row.brandName.trim().toLowerCase();
      brandId = brandByName.get(key);
      if (!brandId) {
        const created = await createBrand(row.brandName.trim());
        brandByName.set(key, created.id);
        brandId = created.id;
      }
    }

    const basePrice = row.basePrice ? Number(row.basePrice) : undefined;
    const msrp = row.msrp ? Number(row.msrp) : undefined;
    const costPrice = row.costPrice ? Number(row.costPrice) : undefined;
    const tags = row.tags ? row.tags.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : undefined;
    const materialsEl = row.materialsEl
      ? row.materialsEl.split("|").map((m) => m.trim()).filter(Boolean)
      : undefined;

    const match = byStyleNumber.get(row.styleNumber.trim());
    try {
      if (match) {
        const update: Record<string, unknown> = { name: row.name.trim() };
        if (row.category) update.category = row.category;
        if (row.season) update.season = row.season;
        if (row.gender) update.gender = row.gender;
        if (row.tagline) update.tagline = row.tagline;
        if (row.description) update.description = sanitizeProductDescription(row.description);
        // Greek copy goes through the same sanitiser as the English description — it is
        // admin-authored HTML from a spreadsheet, which is exactly the untrusted-ish input
        // sanitizeProductDescription exists for, and skipping it for one language would
        // leave a hole that only shows up on the Greek site.
        if (row.taglineEl) update.tagline_el = row.taglineEl;
        if (row.descriptionEl) update.description_el = sanitizeProductDescription(row.descriptionEl);
        if (materialsEl) update.materials_el = materialsEl;
        if (row.lastNoteEl) update.last_note_el = row.lastNoteEl;
        if (basePrice != null) update.base_price = basePrice;
        if (msrp != null) update.msrp = msrp;
        if (costPrice != null) update.cost_price = costPrice;
        if (brandId) update.brand_id = brandId;
        if (tags) update.tags = tags;
        const { error } = await supabaseAdmin.from("styles").update(update).eq("id", match.id);
        if (error) throw new Error(error.message);
        results.push({ row: i + 1, styleNumber: row.styleNumber, action: "updated", errors: [] });
      } else {
        const id = `st-${crypto.randomUUID().slice(0, 8)}`;
        const slug = row.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const { error } = await supabaseAdmin.from("styles").insert({
          id,
          slug,
          style_number: row.styleNumber.trim(),
          name: row.name.trim(),
          category: row.category || "loafers",
          season: row.season || "summer",
          gender: row.gender || "unisex",
          availability: "available",
          tagline: row.tagline || "",
          description: row.description ? sanitizeProductDescription(row.description) : "",
          materials: [],
          tagline_el: row.taglineEl || null,
          description_el: row.descriptionEl ? sanitizeProductDescription(row.descriptionEl) : null,
          materials_el: materialsEl ?? null,
          last_note_el: row.lastNoteEl || null,
          base_price: basePrice ?? 0,
          msrp: msrp ?? 0,
          cost_price: costPrice ?? 0,
          brand_id: brandId,
          tags: tags ?? [],
          status: "draft",
        });
        if (error) throw new Error(error.message);
        results.push({ row: i + 1, styleNumber: row.styleNumber, action: "created", errors: [] });
      }
    } catch (err) {
      results.push({ row: i + 1, styleNumber: row.styleNumber, action: "error", errors: [err instanceof Error ? err.message : "Unknown error."] });
    }
  }

  return results;
}
