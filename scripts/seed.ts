/**
 * Seeds the Supabase project with this app's existing mock data.
 * Run once after applying supabase/migrations/0001_init.sql:
 *
 *   npm run seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { STYLES, ACCOUNTS, ORDERS, ASSORTMENTS } from "./seedData";
import { BOX_TYPES } from "../src/lib/data/boxTypes";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const colorwayId = (styleId: string, cId: string) => `${styleId}-${cId}`;
const shipToId = (accountId: string, sId: string) => `${accountId}-${sId}`;

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

  console.log("Seeding sales_reps + accounts...");
  const repByEmail = new Map<string, string>();
  const repRows: { id: string; name: string; title: string; email: string; phone: string; initials: string; territory: string }[] = [];
  for (const acct of ACCOUNTS) {
    if (!repByEmail.has(acct.rep.email)) {
      const id = crypto.randomUUID();
      repByEmail.set(acct.rep.email, id);
      repRows.push({ id, name: acct.rep.name, title: acct.rep.title, email: acct.rep.email, phone: acct.rep.phone, initials: acct.rep.initials, territory: acct.rep.territory });
    }
  }
  await insert("sales_reps", repRows);

  await insert(
    "accounts",
    ACCOUNTS.map((a) => ({
      id: a.id,
      business_name: a.businessName,
      contact_name: a.contactName,
      email: a.email,
      password: a.password,
      status: a.status,
      credit_terms: a.creditTerms,
      credit_limit: a.creditLimit,
      resale_cert_id: a.resaleCertId,
      business_type: a.businessType,
      store_location: a.storeLocation,
      expected_volume: a.expectedVolume,
      applied_at: a.appliedAt,
      approved_at: a.approvedAt ?? null,
      rep_id: repByEmail.get(a.rep.email),
      role: "buyer",
    })),
  );

  console.log("Seeding ship_to_addresses...");
  await insert(
    "ship_to_addresses",
    ACCOUNTS.flatMap((a) =>
      a.shipTo.map((s) => ({
        id: shipToId(a.id, s.id),
        account_id: a.id,
        label: s.label,
        line1: s.line1,
        line2: s.line2 ?? null,
        city: s.city,
        state: s.state,
        zip: s.zip,
        is_default: s.isDefault ?? false,
      })),
    ),
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

  console.log("Seeding saved_assortments...");
  for (const [accountId, list] of Object.entries(ASSORTMENTS)) {
    for (const a of list) {
      const id = crypto.randomUUID();
      const { error } = await supabase.from("saved_assortments").insert({ id, account_id: accountId, name: a.name, created_at: a.createdAt });
      if (error) throw new Error(`saved_assortments: ${error.message}`);
      await insert(
        "saved_assortment_styles",
        a.styleIds.map((styleId) => ({ assortment_id: id, style_id: styleId })),
      );
    }
  }

  console.log("Seeding orders + order_lines...");
  for (const [accountId, orders] of Object.entries(ORDERS)) {
    for (const o of orders) {
      const { error } = await supabase.from("orders").insert({
        id: o.id,
        account_id: accountId,
        po_number: o.poNumber,
        placed_at: o.placedAt,
        status: o.status,
        terms: o.terms,
        ship_to_id: shipToId(accountId, o.shipToId),
        notes: o.notes ?? null,
        invoice_url: o.invoiceUrl ?? null,
      });
      if (error) throw new Error(`orders: ${error.message}`);
      await insert(
        "order_lines",
        o.lines.map((l) => ({
          order_id: o.id,
          style_id: l.styleId,
          colorway_id: colorwayId(l.styleId, l.colorwayId),
          box_type_id: l.boxTypeId,
          qty: l.qty,
          unit_price: l.unitPrice,
        })),
      );
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
