import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { listAllOrders } from "@/lib/runtimeOrders";
import { getAllAccounts } from "@/lib/data/accounts";
import { getBoxType } from "@/lib/data/boxTypes";
import type { Style } from "@/lib/types";

/** Best-effort — never blocks page rendering if the insert fails or migration 0015 hasn't run. */
export async function recordStyleView(styleId: string, accountId: string | null): Promise<void> {
  const { error } = await supabaseAdmin.from("style_views").insert({ style_id: styleId, account_id: accountId });
  if (error) console.warn(`style_views insert failed: ${error.message}`);
}

export interface SalesPoint {
  month: string;
  pairs: number;
  revenue: number;
}

export interface TopCustomer {
  accountId: string;
  businessName: string;
  pairs: number;
  revenue: number;
}

export interface RecentPurchase {
  orderId: string;
  businessName: string;
  placedAt: string;
  pairs: number;
  revenue: number;
}

export interface StyleAnalytics {
  views: number;
  orders: number;
  pairsSold: number;
  revenue: number;
  profit: number;
  conversionRatePct: number;
  /** This app has no returns/RMA workflow anywhere yet — always 0, shown as "not tracked" in the UI. */
  returns: number;
  /** Pairs sold in the last 90 days / average on-hand — a simple, real turnover proxy. */
  inventoryTurnover: number;
  salesGraph: SalesPoint[];
  topCustomers: TopCustomer[];
  recentPurchases: RecentPurchase[];
}

export async function getStyleAnalytics(style: Style, onHandNow: number): Promise<StyleAnalytics> {
  const [{ count: viewCount }, orders, accounts] = await Promise.all([
    supabaseAdmin.from("style_views").select("id", { count: "exact", head: true }).eq("style_id", style.id),
    listAllOrders(),
    getAllAccounts(),
  ]);
  const views = viewCount ?? 0;
  const businessNameByAccount = new Map(accounts.map((a) => [a.id, a.businessName]));

  const relevantLines = orders.flatMap((order) =>
    order.lines
      .filter((line) => line.styleId === style.id)
      .map((line) => ({ order, line, pairs: line.qty * getBoxType(line.boxTypeId).totalPairs })),
  );

  const orderIds = new Set(relevantLines.map((r) => r.order.id));
  const pairsSold = relevantLines.reduce((sum, r) => sum + r.pairs, 0);
  const revenue = relevantLines.reduce((sum, r) => sum + r.pairs * r.line.unitPrice, 0);
  const profit = relevantLines.reduce((sum, r) => sum + r.pairs * (r.line.unitPrice - style.costPrice), 0);
  const conversionRatePct = views > 0 ? Math.round((orderIds.size / views) * 1000) / 10 : 0;

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }) };
  });
  const byMonth = new Map(months.map((m) => [m.key, { pairs: 0, revenue: 0 }]));
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  let pairsLast90Days = 0;
  for (const { order, pairs, line } of relevantLines) {
    const placed = new Date(order.placedAt);
    const key = `${placed.getFullYear()}-${String(placed.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key);
    if (bucket) {
      bucket.pairs += pairs;
      bucket.revenue += pairs * line.unitPrice;
    }
    if (placed >= ninetyDaysAgo) pairsLast90Days += pairs;
  }
  const salesGraph = months.map((m) => ({ month: m.label, ...byMonth.get(m.key)! }));
  const inventoryTurnover = onHandNow > 0 ? Math.round((pairsLast90Days / onHandNow) * 100) / 100 : 0;

  const byCustomer = new Map<string, { pairs: number; revenue: number }>();
  for (const { order, pairs, line } of relevantLines) {
    const entry = byCustomer.get(order.accountId) ?? { pairs: 0, revenue: 0 };
    entry.pairs += pairs;
    entry.revenue += pairs * line.unitPrice;
    byCustomer.set(order.accountId, entry);
  }
  const topCustomers: TopCustomer[] = Array.from(byCustomer.entries())
    .map(([accountId, v]) => ({ accountId, businessName: businessNameByAccount.get(accountId) ?? accountId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const byOrder = new Map<string, { placedAt: string; accountId: string; pairs: number; revenue: number }>();
  for (const { order, pairs, line } of relevantLines) {
    const entry = byOrder.get(order.id) ?? { placedAt: order.placedAt, accountId: order.accountId, pairs: 0, revenue: 0 };
    entry.pairs += pairs;
    entry.revenue += pairs * line.unitPrice;
    byOrder.set(order.id, entry);
  }
  const recentPurchases: RecentPurchase[] = Array.from(byOrder.entries())
    .map(([orderId, v]) => ({ orderId, businessName: businessNameByAccount.get(v.accountId) ?? v.accountId, placedAt: v.placedAt, pairs: v.pairs, revenue: v.revenue }))
    .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
    .slice(0, 8);

  return {
    views,
    orders: orderIds.size,
    pairsSold,
    revenue: Math.round(revenue * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    conversionRatePct,
    returns: 0,
    inventoryTurnover,
    salesGraph,
    topCustomers,
    recentPurchases,
  };
}
