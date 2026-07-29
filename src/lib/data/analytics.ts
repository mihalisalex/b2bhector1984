import "server-only";
import { listAllOrders } from "@/lib/runtimeOrders";
import { getAllStyles } from "@/lib/data/styles";
import { getBoxType } from "@/lib/data/boxTypes";
import { summarizeOrder } from "@/lib/pricing";

export interface MonthlyRevenue {
  month: string;
  total: number;
}

export interface TopStyle {
  styleId: string;
  styleName: string;
  pairs: number;
  revenue: number;
}

export interface AnalyticsSummary {
  monthlyRevenue: MonthlyRevenue[];
  topStyles: TopStyle[];
  /** % of buyer accounts with more than one order, among accounts with at least one order. */
  reorderRatePct: number;
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [orders, styles] = await Promise.all([listAllOrders(), getAllStyles()]);
  const styleNameById = new Map(styles.map((s) => [s.id, s.name]));

  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    };
  });
  const revenueByMonth = new Map(months.map((m) => [m.key, 0]));
  for (const order of orders) {
    const key = monthKey(order.placedAt);
    if (!revenueByMonth.has(key)) continue;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + summarizeOrder(order).total);
  }
  const monthlyRevenue = months.map((m) => ({ month: m.label, total: Math.round((revenueByMonth.get(m.key) ?? 0) * 100) / 100 }));

  const pairsByStyle = new Map<string, number>();
  const revenueByStyle = new Map<string, number>();
  for (const order of orders) {
    for (const line of order.lines) {
      // Skip rather than crash the whole dashboard on a stale/invalid box
      // type from old data — this box-type enum is constrained today, but
      // analytics shouldn't 500 over one bad historical row either way.
      let totalPairs: number;
      try {
        totalPairs = getBoxType(line.boxTypeId).totalPairs;
      } catch {
        continue;
      }
      const pairs = line.qty * totalPairs;
      pairsByStyle.set(line.styleId, (pairsByStyle.get(line.styleId) ?? 0) + pairs);
      revenueByStyle.set(line.styleId, (revenueByStyle.get(line.styleId) ?? 0) + pairs * line.unitPrice);
    }
  }
  const topStyles = Array.from(pairsByStyle.entries())
    .map(([styleId, pairs]) => ({
      styleId,
      styleName: styleNameById.get(styleId) ?? styleId,
      pairs,
      revenue: Math.round((revenueByStyle.get(styleId) ?? 0) * 100) / 100,
    }))
    .sort((a, b) => b.pairs - a.pairs)
    .slice(0, 5);

  const ordersByAccount = new Map<string, number>();
  for (const order of orders) ordersByAccount.set(order.accountId, (ordersByAccount.get(order.accountId) ?? 0) + 1);
  const buyerCount = ordersByAccount.size;
  const reorderCount = Array.from(ordersByAccount.values()).filter((n) => n > 1).length;
  const reorderRatePct = buyerCount > 0 ? Math.round((reorderCount / buyerCount) * 1000) / 10 : 0;

  return { monthlyRevenue, topStyles, reorderRatePct };
}
