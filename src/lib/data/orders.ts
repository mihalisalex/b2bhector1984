import type { Order } from "@/lib/types";

/** Order history for acct-001 (Union Supply Co.) — the demo login account. */
export const ORDERS: Record<string, Order[]> = {
  "acct-001": [
    {
      id: "ORD-59090",
      poNumber: "US-0522",
      placedAt: "2026-07-25",
      status: "submitted",
      terms: "net30",
      shipToId: "ship-1",
      notes: "Please hold for combined ship with any Interval SC backorder.",
      lines: [
        { styleId: "st-01", colorwayId: "c1", boxTypeId: "box10", qty: 2, unitPrice: 37.11 },
      ],
    },
    {
      id: "ORD-59012",
      poNumber: "US-0514",
      placedAt: "2026-07-20",
      status: "in_production",
      terms: "net30",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-04", colorwayId: "c1", boxTypeId: "box8", qty: 2, unitPrice: 34.68 },
      ],
      invoiceUrl: "#",
    },
    {
      id: "ORD-58877",
      poNumber: "US-0501",
      placedAt: "2026-07-10",
      status: "shipped",
      terms: "net30",
      shipToId: "ship-2",
      lines: [
        { styleId: "st-07", colorwayId: "c1", boxTypeId: "box8", qty: 1, unitPrice: 36.44 },
        { styleId: "st-07", colorwayId: "c1", boxTypeId: "box10", qty: 1, unitPrice: 36.44 },
        { styleId: "st-07", colorwayId: "c3", boxTypeId: "box12", qty: 1, unitPrice: 36.44 },
      ],
      invoiceUrl: "#",
    },
    {
      id: "ORD-58210",
      poNumber: "US-0472",
      placedAt: "2026-06-02",
      status: "delivered",
      terms: "net30",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-01", colorwayId: "c1", boxTypeId: "box10", qty: 1, unitPrice: 37.11 },
        { styleId: "st-01", colorwayId: "c1", boxTypeId: "box12", qty: 1, unitPrice: 37.11 },
        { styleId: "st-01", colorwayId: "c2", boxTypeId: "box10", qty: 1, unitPrice: 37.11 },
        { styleId: "st-02", colorwayId: "c2", boxTypeId: "box8", qty: 1, unitPrice: 33.54 },
        { styleId: "st-02", colorwayId: "c2", boxTypeId: "box10", qty: 1, unitPrice: 33.54 },
      ],
      invoiceUrl: "#",
    },
  ],
  "acct-002": [
    {
      id: "ORD-57110",
      poNumber: "FH-2291",
      placedAt: "2026-07-15",
      status: "shipped",
      terms: "net60",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-11", colorwayId: "c1", boxTypeId: "box12", qty: 3, unitPrice: 35.96 },
      ],
      invoiceUrl: "#",
    },
  ],
  "acct-003": [
    {
      id: "ORD-59201",
      poNumber: "TM-0031",
      placedAt: "2026-07-24",
      status: "submitted",
      terms: "prepay",
      shipToId: "ship-1",
      lines: [
        { styleId: "st-14", colorwayId: "c1", boxTypeId: "box8", qty: 1, unitPrice: 43 },
      ],
    },
  ],
};

export function getOrdersForAccount(accountId: string): Order[] {
  return ORDERS[accountId] ?? [];
}
