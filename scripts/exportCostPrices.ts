/**
 * Writes cost-prices.csv — one row per active style, for filling the `cost_price` column
 * in a spreadsheet and importing back with applyCostPrices.ts.
 *
 *   npx tsx scripts/exportCostPrices.ts
 *
 * Every style has carried cost_price = 0 since launch, which makes every margin figure in
 * /admin read 100%. Thirty-one numbers typed one product editor at a time is the kind of
 * job that gets abandoned halfway; a spreadsheet is the shape this work actually wants.
 *
 * The margin column is computed here rather than left to Excel so the file is readable as
 * it stands, and so a wrong figure is visible before it is imported rather than after.
 */
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface Row {
  style_number: string;
  name: string;
  base_price: number;
  cost_price: number | null;
  currency: string | null;
}

/** Quote every field: style names contain commas, and Excel is happier with it. */
function cell(value: string | number): string {
  return `"${String(value).replace(/"/g, '""')}"`;
}

async function main() {
  const { data, error } = await db
    .from("styles")
    .select("style_number,name,base_price,cost_price,currency,status")
    .eq("status", "active")
    .order("style_number");

  if (error) throw new Error(`styles: ${error.message}`);
  const rows = (data ?? []) as unknown as Row[];

  const out = [
    [
      "Style number",
      "Name",
      "List price",
      "Cost price",
      "Margin %",
      "Currency",
    ].join(","),
  ];

  let missing = 0;
  for (const r of rows) {
    const cost = r.cost_price ?? 0;
    if (!cost) missing++;
    const margin = cost && r.base_price ? (((r.base_price - cost) / r.base_price) * 100).toFixed(1) : "";
    out.push(
      [
        cell(r.style_number),
        cell(r.name),
        cell(r.base_price),
        // Empty rather than 0 for an unset cost: a blank cell reads as "still to do",
        // where a 0 looks like a decision someone already made.
        cell(cost || ""),
        cell(margin),
        cell(r.currency ?? "EUR"),
      ].join(","),
    );
  }

  // BOM so Excel on Windows opens this as UTF-8 — style names carry Greek and accented
  // characters, and without it they arrive as mojibake and get saved back that way.
  writeFileSync("cost-prices.csv", "﻿" + out.join("\r\n") + "\r\n", "utf8");

  console.log(`Wrote cost-prices.csv — ${rows.length} active styles.`);
  console.log(`  cost price still missing: ${missing}`);
  console.log("");
  console.log("Fill the 'Cost price' column, keep every row, then:");
  console.log("  npx tsx scripts/applyCostPrices.ts");
}

main();
