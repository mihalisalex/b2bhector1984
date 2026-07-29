import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAllStyles } from "@/lib/data/styles";
import { createBrand, getAllBrands } from "@/lib/data/brands";
import { sanitizeProductDescription } from "@/lib/sanitizeHtml";
import type { Category, Gender, Season } from "@/lib/types";

const CATEGORIES: Category[] = ["loafers", "wedding", "sneakers", "sandals", "boots", "formal", "anatomic"];
const SEASONS: Season[] = ["summer", "winter"];
const GENDERS: Gender[] = ["mens", "womens", "unisex"];

export interface ImportRow {
  styleNumber: string;
  name: string;
  category?: string;
  season?: string;
  gender?: string;
  tagline?: string;
  description?: string;
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
  if (row.season && !SEASONS.includes(row.season as Season)) errors.push(`Unknown season "${row.season}".`);
  if (row.gender && !GENDERS.includes(row.gender as Gender)) errors.push(`Unknown gender "${row.gender}".`);
  if (row.basePrice && !Number.isFinite(Number(row.basePrice))) errors.push(`Wholesale price "${row.basePrice}" isn't a number.`);
  if (row.msrp && !Number.isFinite(Number(row.msrp))) errors.push(`MSRP "${row.msrp}" isn't a number.`);
  if (row.costPrice && !Number.isFinite(Number(row.costPrice))) errors.push(`Cost price "${row.costPrice}" isn't a number.`);
  return errors;
}

/** Validates every row without writing anything — used for the import wizard's preview step. */
export function validateImportRows(rows: ImportRow[]): { row: number; styleNumber: string; errors: string[] }[] {
  return rows.map((row, i) => ({ row: i + 1, styleNumber: row.styleNumber, errors: validateRow(row) }));
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

    const match = byStyleNumber.get(row.styleNumber.trim());
    try {
      if (match) {
        const update: Record<string, unknown> = { name: row.name.trim() };
        if (row.category) update.category = row.category;
        if (row.season) update.season = row.season;
        if (row.gender) update.gender = row.gender;
        if (row.tagline) update.tagline = row.tagline;
        if (row.description) update.description = sanitizeProductDescription(row.description);
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
