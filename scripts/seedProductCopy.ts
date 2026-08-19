/**
 * Fills the empty `tagline` and `materials` on the catalogue's 31 styles (QA-028).
 *
 *   npx tsx scripts/seedProductCopy.ts          # dry run, prints and writes nothing
 *   npx tsx scripts/seedProductCopy.ts --apply  # writes
 *
 * The rule this script follows: **nothing here is invented.** Every material is a
 * phrase the product's own "Key Features" list already states, and every tagline is
 * assembled from facts that are already in the database — the colourway name, the
 * silhouette and the occasions named in the body copy. It reformats and shortens the
 * owner's own words; it does not make claims about the product that the site was not
 * already making.
 *
 * What it deliberately does NOT touch:
 *  - `description` — the body copy is good, it is the owner's, and it stays untouched.
 *    The duplication across colourways of one style is handled by giving each row its
 *    own tagline instead, which is what the page renders under the H1.
 *  - `cost_price` — that is a real commercial figure only the business knows. Still 0
 *    on all 31, so the editor's "Margin 100%" remains meaningless until someone fills
 *    it in. Reported at the end rather than guessed.
 *  - Any field that already has a value. The two styles that already carry materials
 *    keep exactly what the owner set, including their wording.
 *
 * Why taglines matter beyond the page: `generateProductDescription` prefers the tagline
 * when it is at least 70 characters, so filling these also gives all 31 products a
 * genuinely distinct meta description instead of leaning on the name-prefix fallback.
 * Every tagline below is written past that threshold on purpose.
 *
 * Idempotent — reruns skip anything already populated.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const supabase = createClient(url, key, { auth: { persistSession: false } });

/**
 * One entry per distinct body copy in the catalogue — eleven style families, each
 * shared by between two and five colourways.
 *
 * `match` is a distinctive phrase from that family's own opening paragraph, used to
 * identify which family a row belongs to without depending on style numbers (which
 * are inconsistent) or names (which vary in spacing and colour placement).
 *
 * `materials` are lifted from that family's own <li> Key Features. `tagline(colour)`
 * composes the colourway with the silhouette and occasions the same copy names.
 */
interface Family {
  match: string;
  materials: string[];
  tagline: (colour: string) => string;
}

const FAMILIES: Family[] = [
  {
    match: "this suede boat shoe brings soft texture",
    materials: ["Suede upper", "Breathable lining", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} brushed suede boat shoe with lace detail and a cushioned footbed — relaxed warm-weather styling for spring and summer smart-casual.`,
  },
  {
    match: "this leather espadrille combines a soft upper",
    materials: ["Genuine leather upper", "Breathable lining", "Lightweight summer sole"],
    tagline: (c) =>
      `${c} genuine leather espadrille on a lightweight, flexible summer sole — an easy slip-on made for warm-weather and holiday wear.`,
  },
  {
    match: "this leather loafer is made for days that move",
    materials: ["Genuine leather upper", "Breathable lining", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} genuine leather slip-on loafer with a cushioned footbed and breathable lining — versatile enough for work, travel and weekends.`,
  },
  {
    match: "this leather formal boot brings a polished finish",
    materials: ["Genuine leather upper", "Breathable lining", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} genuine leather formal boot in a clean ankle-height profile — smart enough for the office, robust enough for daily winter wear.`,
  },
  {
    match: "this leather sneaker takes a classic low-profile",
    materials: ["Genuine leather upper", "Breathable lining", "Rubber outsole"],
    tagline: (c) =>
      `${c} genuine leather sneaker on a durable rubber outsole — a clean, low-profile silhouette for smart-casual work, travel and weekends.`,
  },
  {
    match: "this suede sneaker brings warmth and depth",
    materials: ["Suede upper", "Breathable lining", "Rubber outsole"],
    tagline: (c) =>
      `${c} brushed suede sneaker on a durable rubber outsole — a low-profile silhouette with the softer, warmer finish suede gives.`,
  },
  {
    match: "A classic leather formal shoe built around clean lines",
    materials: ["Genuine leather upper", "Breathable lining", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} genuine leather lace-up in a timeless formal cut — cushioned, breathable and suited to business dress, ceremonies and smart occasions.`,
  },
  {
    match: "this leather groom's shoe pairs a refined silhouette",
    materials: ["Genuine leather upper", "Breathable lining", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} genuine leather groom's shoe in an elegant, occasion-ready silhouette — cushioned for the long hours a wedding day actually asks for.`,
  },
  {
    match: "this leather formal loafer is designed to elevate",
    materials: ["Genuine leather upper", "Breathable lining", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} genuine leather formal loafer in a classic slip-on cut — an elegant finish for the office, business dress, weddings and formal occasions.`,
  },
  {
    match: "this leather boat shoe brings relaxed, warm-weather",
    materials: ["Genuine leather upper", "Breathable lining", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} genuine leather boat shoe with classic lace detail and a flexible sole — relaxed spring and summer styling for everyday smart-casual wear.`,
  },
  {
    match: "this leather sandal keeps things simple",
    materials: ["Genuine leather straps", "Contoured cushioned footbed", "Slip-resistant outsole"],
    tagline: (c) =>
      `${c} genuine leather sandal with adjustable fastening and a contoured, arch-supporting footbed — open and breathable for the warmest months.`,
  },
];

/** "TAN BROWN" -> "Tan Brown", so the tagline opens like a sentence rather than a shout. */
function displayColour(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function stripHtml(html: string): string {
  return (html ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function main() {
  const { data: styles, error } = await supabase
    .from("styles")
    .select("id, style_number, name, description, tagline, materials, cost_price")
    .order("style_number");
  if (error) throw error;

  const { data: colorways, error: cwError } = await supabase.from("colorways").select("style_id, name");
  if (cwError) throw cwError;

  let taglinesSet = 0;
  let materialsSet = 0;
  let skipped = 0;
  const unmatched: string[] = [];

  for (const style of styles ?? []) {
    const body = stripHtml(style.description);
    const family = FAMILIES.find((f) => body.includes(f.match));
    if (!family) {
      unmatched.push(style.name);
      continue;
    }

    const colour = colorways?.find((c) => c.style_id === style.id)?.name;
    if (!colour) {
      unmatched.push(`${style.name} (no colourway)`);
      continue;
    }

    const patch: Record<string, unknown> = {};
    const hasTagline = Boolean(style.tagline && String(style.tagline).trim());
    const hasMaterials = Array.isArray(style.materials) && style.materials.length > 0;

    if (!hasTagline) {
      patch.tagline = family.tagline(displayColour(colour));
      taglinesSet++;
    }
    if (!hasMaterials) {
      patch.materials = family.materials;
      materialsSet++;
    }

    if (Object.keys(patch).length === 0) {
      skipped++;
      continue;
    }

    console.log(`${style.name}`);
    if (patch.tagline) console.log(`   tagline  (${String(patch.tagline).length}) ${patch.tagline}`);
    if (patch.materials) console.log(`   materials ${JSON.stringify(patch.materials)}`);

    if (APPLY) {
      const { error: updateError } = await supabase.from("styles").update(patch).eq("id", style.id);
      if (updateError) throw updateError;
    }
  }

  const missingCost = (styles ?? []).filter((s) => !Number(s.cost_price)).length;

  console.log(`\n${APPLY ? "APPLIED" : "DRY RUN — nothing written"}`);
  console.log(`  taglines set:  ${taglinesSet}`);
  console.log(`  materials set: ${materialsSet}`);
  console.log(`  already populated, left alone: ${skipped}`);
  if (unmatched.length) console.log(`  UNMATCHED (needs a family added): ${unmatched.join(", ")}`);
  if (missingCost) {
    console.log(`\n  cost_price is still 0 on ${missingCost} of ${(styles ?? []).length} styles.`);
    console.log(`  Not guessable — the margin figure in the product editor stays meaningless until the business fills it in.`);
  }
  if (!APPLY) console.log(`\n  Rerun with --apply to write.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
