/**
 * Exercises the proforma builder's server half without a browser or a login.
 *
 *   npx tsx scripts/checkProformaBuilder.ts
 *
 * WHY. react-pdf on this project has form: a change to InvoiceDocument once shipped a
 * proforma that rendered 24 mostly-blank pages with misaligned columns, and it passed
 * review because it had only ever been tried on a two-line happy path. The standing lesson
 * is that PDF changes here need a realistic-size render, not a smoke test — so this builds
 * a deliberately awkward one: many lines, long names, mixed box formats, mixed
 * stock/production, and a Greek document where the number format and date differ.
 *
 * It also asserts the guards actually refuse, because the whole safety story of this
 * feature is that a quote cannot become an order or move stock.
 */
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

import { parseProformaDraft, resolveProforma, ProformaError } from "@/lib/proformaDraft";
import { buildInvoicePdf } from "@/lib/pdf/buildInvoicePdf";
import { getStyleById } from "@/lib/data/styles";
import { getInventoryForStyles } from "@/lib/data/inventory";
import type { Style } from "@/lib/types";

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

function expectReject(label: string, body: unknown, expectMatch: RegExp) {
  try {
    parseProformaDraft(body);
  } catch (err) {
    const message = err instanceof ProformaError ? err.message : String(err);
    const ok = expectMatch.test(message);
    console.log(`  ${ok ? "ok  " : "FAIL"} ${label} → ${message}`);
    return ok;
  }
  console.log(`  FAIL ${label} → accepted, should have been rejected`);
  return false;
}

async function main() {
  let failures = 0;

  console.log("Input guards");
  const base = { recipient: { businessName: "Test" }, terms: "net60", locale: "el", lines: [] as unknown[] };
  if (!expectReject("no business name", { ...base, recipient: {} }, /Business name/i)) failures++;
  if (!expectReject("bad terms", { ...base, terms: "net90", lines: [{}] }, /payment terms/i)) failures++;
  if (!expectReject("bad locale", { ...base, locale: "es", lines: [{}] }, /document language/i)) failures++;
  if (!expectReject("no lines", base, /at least one product/i)) failures++;
  if (
    !expectReject(
      "zero qty",
      { ...base, lines: [{ styleId: "a", colorwayId: "b", boxTypeId: "box10", qty: 0 }] },
      /quantity must be/i,
    )
  )
    failures++;

  // Colourway ids are LOCAL in the domain model — `getStyleById` returns "c1", while the
  // `colorways` table stores "st-42d5ccdb-c1". `getInventoryForStyles` converts with
  // `fromDbId`, so both sides of the fulfillment lookup speak the same dialect; a test that
  // reads raw table ids does not, and would fail against correct code.
  const { data: rows } = await db.from("styles").select("id,name,available_box_types").eq("status", "active");
  const active = (rows ?? []) as { id: string; name: string; available_box_types: string[] }[];

  const styleById = new Map<string, Style | undefined>();
  for (const s of active) styleById.set(s.id, await getStyleById(s.id));
  const inv = await getInventoryForStyles(active.map((s) => s.id));

  const styleA = active[0];
  const styleAModel = styleById.get(styleA.id)!;

  console.log("\nCross-object guards");
  for (const [label, line, match] of [
    [
      "colourway that does not exist on the style",
      { styleId: styleA.id, colorwayId: "c99", boxTypeId: styleA.available_box_types[0], qty: 1 },
      /no colourway/i,
    ],
    [
      "box size the style isn't sold in",
      {
        styleId: styleA.id,
        colorwayId: styleAModel.colorways[0].id,
        boxTypeId: styleA.available_box_types[0] === "box8" ? "box12" : "box8",
        qty: 1,
      },
      /not sold in that box size/i,
    ],
    [
      "style that no longer exists",
      { styleId: "st-deadbeef", colorwayId: "c1", boxTypeId: "box10", qty: 1 },
      /no longer exists/i,
    ],
  ] as [string, Record<string, unknown>, RegExp][]) {
    try {
      const draft = parseProformaDraft({ ...base, lines: [line] });
      resolveProforma(draft, styleById, inv);
      console.log(`  FAIL ${label} → accepted`);
      failures++;
    } catch (err) {
      const message = err instanceof ProformaError ? err.message : String(err);
      const ok = match.test(message);
      console.log(`  ${ok ? "ok  " : "FAIL"} ${label} → ${message}`);
      if (!ok) failures++;
    }
  }

  // A realistic, awkward document: one line per active style, every colourway cycled.
  console.log("\nFull render");
  const lines = active
    .map((style, i) => {
      const model = styleById.get(style.id);
      const colorway = model?.colorways[i % Math.max(1, model.colorways.length)];
      return colorway
        ? { styleId: style.id, colorwayId: colorway.id, boxTypeId: style.available_box_types[0], qty: (i % 4) + 1 }
        : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const draft = parseProformaDraft({
    recipient: {
      businessName: "Υποδήματα Παπαδόπουλος & Σία Ο.Ε.",
      contactName: "Γεώργιος Παπαδόπουλος",
      addressLine1: "Λεωφόρος Κνωσού 128",
      city: "Ηράκλειο",
      region: "Κρήτη",
      postalCode: "71409",
    },
    terms: "net30",
    locale: "el",
    lines,
  });

  const resolved = resolveProforma(draft, styleById, inv);
  const t0 = Date.now();
  const pdf = await buildInvoicePdf({
    order: { id: resolved.reference, placedAt: new Date().toISOString(), status: "submitted", terms: draft.terms },
    businessName: draft.recipient.businessName,
    contactName: draft.recipient.contactName,
    shipTo: resolved.shipTo,
    lines: resolved.lines,
    styleById,
    locale: draft.locale,
  });
  const ms = Date.now() - t0;

  const text = pdf.toString("latin1");
  const pageCount = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  const out = "proforma-check.pdf";
  writeFileSync(out, pdf);

  console.log(`  reference   ${resolved.reference}`);
  console.log(`  lines       ${resolved.lines.length}`);
  console.log(`  stock/prod  ${resolved.lines.filter((l) => l.fulfillment === "stock").length}/${resolved.lines.filter((l) => l.fulfillment === "production").length}`);
  console.log(`  bytes       ${pdf.length.toLocaleString()}`);
  console.log(`  pages       ${pageCount}`);
  console.log(`  render      ${ms} ms`);
  console.log(`  written     ${out}`);

  if (!resolved.reference.startsWith("PF-")) {
    console.log("  FAIL reference is not a PF- quote reference");
    failures++;
  }
  // The 24-blank-page bug produced a page count wildly out of proportion to the content.
  const expectedMax = Math.ceil(resolved.lines.length / 6) + 2;
  if (pageCount === 0 || pageCount > expectedMax) {
    console.log(`  FAIL page count ${pageCount} is implausible for ${resolved.lines.length} lines (expected ≤ ${expectedMax})`);
    failures++;
  }
  if (pdf.length < 20_000) {
    console.log(`  FAIL PDF is suspiciously small (${pdf.length} bytes) — photos probably did not inline`);
    failures++;
  }

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
  if (failures > 0) process.exitCode = 1;
}

main();
