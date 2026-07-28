/**
 * Seeds plausible demo stock levels into `inventory` for every style x
 * colorway x box-type combination the style actually offers. Idempotent —
 * upserts on the (style_id, colorway_id, box_type_id) unique constraint, so
 * reruns just refresh the numbers rather than erroring. Run once after
 * supabase/migrations/0008_inventory.sql:
 *
 *   npm run seed:inventory
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

const supabase = createClient(url, key, { auth: { persistSession: false } });

// Weighted so most combos are well-stocked, a few are low, and a couple are
// out — gives the UI something real to show (low-stock badges, oversell
// blocks) instead of every cell looking identically "in stock."
function randomStock(): number {
  const roll = Math.random();
  if (roll < 0.1) return 0;
  if (roll < 0.25) return Math.floor(Math.random() * 4) + 1; // 1-4, low stock
  return Math.floor(Math.random() * 30) + 5; // 5-34
}

async function main() {
  const { data: styles, error: styleError } = await supabase.from("styles").select("id, available_box_types");
  if (styleError) throw new Error(`styles: ${styleError.message}`);

  const { data: colorways, error: colorwayError } = await supabase.from("colorways").select("id, style_id");
  if (colorwayError) throw new Error(`colorways: ${colorwayError.message}`);

  const colorwaysByStyle = new Map<string, string[]>();
  for (const c of colorways ?? []) {
    if (!colorwaysByStyle.has(c.style_id)) colorwaysByStyle.set(c.style_id, []);
    colorwaysByStyle.get(c.style_id)!.push(c.id);
  }

  const rows: { style_id: string; colorway_id: string; box_type_id: string; on_hand: number }[] = [];
  for (const style of styles ?? []) {
    const boxTypes: string[] = style.available_box_types ?? ["box8", "box10", "box12"];
    const colorwayIds = colorwaysByStyle.get(style.id) ?? [];
    for (const colorwayId of colorwayIds) {
      for (const boxTypeId of boxTypes) {
        rows.push({ style_id: style.id, colorway_id: colorwayId, box_type_id: boxTypeId, on_hand: randomStock() });
      }
    }
  }

  const { error } = await supabase.from("inventory").upsert(rows, { onConflict: "style_id,colorway_id,box_type_id" });
  if (error) throw new Error(`inventory: ${error.message}`);
  console.log(`Seeded inventory for ${rows.length} style/colorway/box combinations.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
