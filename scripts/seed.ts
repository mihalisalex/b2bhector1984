/**
 * Seeds the Supabase project's catalog reference data (box types, styles, colorways).
 * Run once after applying supabase/migrations/0001_init.sql:
 *
 *   npm run seed
 *
 * Deliberately does NOT seed accounts/orders/saved_assortments anymore, even though
 * `./seedData` still exports fictional ACCOUNTS/ORDERS/ASSORTMENTS data — this app went
 * live 2026-08-03 and those rows (3 demo buyer accounts sharing a hardcoded password,
 * plus their orders) were deleted from production. Since `insert()` only fails on a
 * primary-key conflict, re-running the old version of this script today would have
 * silently re-created that shared-password demo data (accounts/ship_to are seeded
 * before styles/colorways, which *would* correctly fail on conflict — but by then the
 * damage from the accounts step is already done). If you need demo buyer accounts again
 * for local/staging use, seed them by hand against a non-production database.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { STYLES } from "./seedData";
import { BOX_TYPES } from "../src/lib/data/boxTypes";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const colorwayId = (styleId: string, cId: string) => `${styleId}-${cId}`;

async function insert(table: string, rows: unknown[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length} rows`);
}

/** Static reference data — upsert so reseeding after a catalog-only migration doesn't hit a PK conflict. */
async function upsert(table: string, rows: unknown[]) {
  if (rows.length === 0) return;
  const { error } = await supabase.from(table).upsert(rows);
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`  ${table}: ${rows.length} rows`);
}

async function main() {
  console.log("Seeding box_types...");
  await upsert(
    "box_types",
    BOX_TYPES.map((b, i) => ({
      id: b.id,
      label: b.label,
      total_pairs: b.totalPairs,
      size_breakdown: b.sizeBreakdown,
      sort_order: i,
    })),
  );

  console.log("Seeding styles + colorways...");
  await insert(
    "styles",
    STYLES.map((s) => ({
      id: s.id,
      slug: s.slug,
      style_number: s.styleNumber,
      name: s.name,
      category: s.category,
      season: s.season,
      gender: s.gender,
      availability: s.availability,
      ship_window: s.shipWindow ?? null,
      tagline: s.tagline,
      description: s.description,
      materials: s.materials,
      base_price: s.basePrice,
      msrp: s.msrp,
      weight_oz: s.weightOz,
      last_note: s.lastNote,
    })),
  );
  await insert(
    "colorways",
    STYLES.flatMap((s) =>
      s.colorways.map((c, i) => ({
        id: colorwayId(s.id, c.id),
        style_id: s.id,
        name: c.name,
        sku_suffix: c.skuSuffix,
        swatch_1: c.swatch[0],
        swatch_2: c.swatch[1] ?? null,
        sort_order: i,
      })),
    ),
  );

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
