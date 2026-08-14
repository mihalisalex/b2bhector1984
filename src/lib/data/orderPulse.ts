import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { CACHE_TAGS, CACHE_TTL_SECONDS } from "@/lib/cacheTags";

/**
 * Live order activity for the homepage "pulse" strip.
 *
 * Every figure here is read from real `orders` / `order_lines` rows — nothing is synthesised.
 * That constraint is the whole point: this block is public-facing social proof, and inventing
 * order counts or customer cities would be a false popularity claim (and, for an EU trader,
 * a regulated one). If the real numbers are thin, the component's job is to stay quiet, not
 * to embellish — see `hasSignal` below.
 *
 * Deliberately NOT exposed: customer names, account ids, order values, or anything that
 * identifies who bought what. Only counts and the best-selling style are surfaced.
 *
 * Counts every buyer account without filtering. Verified 2026-08-14 that the figures match
 * the database exactly, but note the orders are concentrated in a small number of accounts —
 * if internal/test accounts ever need excluding from the public figures, this function is
 * the single place to do it (filter `orders` by `account_id` before any of the maths below).
 */
export interface OrderPulse {
  /** Orders placed since local midnight. Genuinely 0 on a quiet day — B2B, not retail. */
  todayCount: number;
  /** Orders in the trailing 7 days, for when today is quiet. */
  weekCount: number;
  /** Best-selling style over the trailing 30 days, by boxes ordered. */
  topStyle: { name: string; styleNumber: string; boxes: number; slug: string; imageUrl: string | null } | null;
  /** How many distinct styles have moved in the trailing 30 days, and out of how many live. */
  stylesMoved: number;
  stylesTotal: number;
  /** Whether there's enough real activity to be worth rendering at all. */
  hasSignal: boolean;
}

async function fetchOrderPulse(): Promise<OrderPulse> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 864e5).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 864e5).toISOString();

  const [ordersRes, stylesRes] = await Promise.all([
    supabaseAdmin.from("orders").select("id,placed_at").gte("placed_at", monthAgo),
    supabaseAdmin.from("styles").select("id,name,style_number,slug,status"),
  ]);
  if (ordersRes.error) throw new Error(`orders: ${ordersRes.error.message}`);
  if (stylesRes.error) throw new Error(`styles: ${stylesRes.error.message}`);

  const orders = ordersRes.data ?? [];
  const todayCount = orders.filter((o) => String(o.placed_at) >= startOfToday).length;
  const weekCount = orders.filter((o) => String(o.placed_at) >= weekAgo).length;

  const { data: lines, error: linesError } = await supabaseAdmin
    .from("order_lines")
    .select("order_id,style_id,qty")
    .in("order_id", orders.map((o) => o.id));
  if (linesError) throw new Error(`order_lines: ${linesError.message}`);

  const boxesByStyle = new Map<string, number>();
  for (const line of lines ?? []) {
    boxesByStyle.set(line.style_id, (boxesByStyle.get(line.style_id) ?? 0) + (Number(line.qty) || 0));
  }

  const liveStyles = (stylesRes.data ?? []).filter((s) => (s.status ?? "active") === "active");
  const byId = new Map(liveStyles.map((s) => [s.id, s]));

  let topStyleId: string | null = null;
  let topStyle: OrderPulse["topStyle"] = null;
  for (const [styleId, boxes] of boxesByStyle) {
    const s = byId.get(styleId);
    if (!s) continue; // archived/deleted styles shouldn't be advertised as a best seller
    if (!topStyle || boxes > topStyle.boxes) {
      topStyleId = styleId;
      topStyle = { name: s.name, styleNumber: s.style_number, slug: s.slug, boxes, imageUrl: null };
    }
  }

  // Primary photo for the winner only — one extra query, not one per style.
  if (topStyle && topStyleId) {
    const { data: img } = await supabaseAdmin
      .from("style_images")
      .select("storage_path")
      .eq("style_id", topStyleId)
      .eq("is_primary", true)
      .limit(1)
      .maybeSingle();
    if (img?.storage_path) {
      topStyle.imageUrl = supabaseAdmin.storage.from("style-images").getPublicUrl(img.storage_path).data.publicUrl;
    }
  }

  const stylesMoved = [...boxesByStyle.keys()].filter((id) => byId.has(id)).length;

  return {
    todayCount,
    weekCount,
    topStyle,
    stylesMoved,
    stylesTotal: liveStyles.length,
    // One real order in the last week isn't social proof, it's an accident. Below that bar
    // the strip hides itself rather than advertising how quiet things are.
    hasSignal: weekCount >= 2 && topStyle !== null,
  };
}

/** Cached like the other storefront reads — tagged on `styles` so a catalog change can't
 * leave a best seller pointing at an archived product. */
export const getOrderPulse = cache(
  unstable_cache(fetchOrderPulse, ["order-pulse"], {
    tags: [CACHE_TAGS.styles],
    revalidate: CACHE_TTL_SECONDS,
  }),
);
