/**
 * Reads an edited cost-prices.csv back into styles.cost_price.
 *
 *   npx tsx scripts/applyCostPrices.ts [path/to/cost-prices.csv] [--commit]
 *
 * DRY RUN BY DEFAULT. Without --commit it prints exactly what it would change and writes
 * nothing. This talks to the production database — there is no staging — so the default
 * has to be the harmless one.
 *
 * Refuses outright, before writing anything, if:
 *   - a style number in the file is not in the catalogue (renamed or typo'd)
 *   - an active style is missing from the file (a truncated spreadsheet save)
 *   - a cost price is not a number, or is negative
 *
 * Warns but proceeds on a cost at or above list price. That is usually a decimal in the
 * wrong place, but it is legitimately possible on a clearance style, so it is the owner's
 * call rather than the script's.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** RFC 4180 parser — style names contain commas, so a naive split mangles them. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const s = text.replace(/^﻿/, "");

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((f) => f !== ""));
}

/**
 * Accepts both decimal conventions. A Greek spreadsheet writes 24,90 and an English one
 * 24.90; rejecting the comma form would fail exactly the person most likely to be typing
 * these. Thousands separators are stripped first so "1.250,00" and "1,250.00" both work.
 */
function parseAmount(raw: string): number | null {
  const t = raw.trim().replace(/[€\s]/g, "");
  if (!t) return null;
  let normalised = t;
  if (t.includes(",") && t.includes(".")) {
    normalised = t.lastIndexOf(",") > t.lastIndexOf(".") ? t.replace(/\./g, "").replace(",", ".") : t.replace(/,/g, "");
  } else if (t.includes(",")) {
    normalised = t.replace(",", ".");
  }
  const n = Number(normalised);
  return Number.isFinite(n) ? n : null;
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const path = args.find((a) => !a.startsWith("--")) ?? "cost-prices.csv";

  const rows = parseCsv(readFileSync(path, "utf8"));
  const [header, ...body] = rows;
  const styleCol = header.findIndex((h) => /style number/i.test(h));
  const costCol = header.findIndex((h) => /cost price/i.test(h));
  if (styleCol < 0 || costCol < 0) {
    console.log("ABORT: need 'Style number' and 'Cost price' columns. Found:", header.join(" | "));
    return;
  }

  const { data, error } = await db
    .from("styles")
    .select("id,style_number,name,base_price,cost_price,status")
    .eq("status", "active");
  if (error) throw new Error(`styles: ${error.message}`);
  const live = new Map(
    (data ?? []).map((s) => [
      (s as { style_number: string }).style_number,
      s as unknown as { id: string; style_number: string; name: string; base_price: number; cost_price: number | null },
    ]),
  );

  const errors: string[] = [];
  const warnings: string[] = [];
  const changes: { id: string; styleNumber: string; name: string; from: number; to: number; margin: string }[] = [];
  const seen = new Set<string>();

  for (const r of body) {
    const styleNumber = (r[styleCol] ?? "").trim();
    if (!styleNumber) continue;
    seen.add(styleNumber);

    const style = live.get(styleNumber);
    if (!style) {
      errors.push(`unknown style number "${styleNumber}" — not an active style`);
      continue;
    }

    const raw = (r[costCol] ?? "").trim();
    if (!raw) continue; // left blank on purpose; leave whatever is stored alone
    const cost = parseAmount(raw);
    if (cost === null) {
      errors.push(`${styleNumber}: "${raw}" is not a number`);
      continue;
    }
    if (cost < 0) {
      errors.push(`${styleNumber}: cost price is negative (${cost})`);
      continue;
    }
    if (cost >= style.base_price) {
      warnings.push(`${styleNumber}: cost ${cost} is at or above list ${style.base_price} — check the decimal point`);
    }

    const from = style.cost_price ?? 0;
    if (from === cost) continue;
    changes.push({
      id: style.id,
      styleNumber,
      name: style.name,
      from,
      to: cost,
      margin: style.base_price ? (((style.base_price - cost) / style.base_price) * 100).toFixed(1) : "—",
    });
  }

  for (const sn of live.keys()) {
    if (!seen.has(sn)) errors.push(`active style "${sn}" is missing from the file — was it truncated?`);
  }

  if (errors.length) {
    console.log(`REFUSED — ${errors.length} problem(s), nothing written:\n`);
    for (const e of errors) console.log("  " + e);
    return;
  }

  for (const w of warnings) console.log("  WARNING: " + w);
  if (warnings.length) console.log("");

  if (changes.length === 0) {
    console.log("No changes — every cost price already matches the file.");
    return;
  }

  console.log(`${changes.length} style(s) to update:\n`);
  for (const c of changes) {
    console.log(
      `  ${c.styleNumber.padEnd(11)} ${String(c.from).padStart(7)} -> ${String(c.to).padStart(7)}   margin ${c.margin.padStart(5)}%   ${c.name}`,
    );
  }

  if (!commit) {
    console.log("\nDry run — nothing written. Re-run with --commit to apply.");
    return;
  }

  for (const c of changes) {
    const { error: e } = await db.from("styles").update({ cost_price: c.to }).eq("id", c.id);
    if (e) throw new Error(`${c.styleNumber}: ${e.message}`);
  }
  console.log(`\nWrote ${changes.length} cost price(s).`);
}

main();
