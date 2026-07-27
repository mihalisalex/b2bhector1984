import { cookies } from "next/headers";
import { ORDERS } from "@/lib/data/orders";
import type { Order } from "@/lib/types";

const EXTRA_ORDERS_COOKIE = "hector_orders_extra";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

interface StoredOrder {
  accountId: string;
  order: Order;
}

const VALID_BOX_TYPES = new Set(["box8", "box10", "box12"]);

async function readExtraOrders(): Promise<StoredOrder[]> {
  const store = await cookies();
  const raw = store.get(EXTRA_ORDERS_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredOrder[];
    if (!Array.isArray(parsed)) return [];
    // Defensive against an older order shape lingering in the cookie
    // (pre box-ordering: lines keyed by size instead of boxTypeId).
    return parsed.filter(
      (s) => s?.order?.lines?.every((l) => VALID_BOX_TYPES.has(l.boxTypeId)) ?? false,
    );
  } catch {
    return [];
  }
}

export async function getOrdersForAccount(accountId: string): Promise<Order[]> {
  const extra = (await readExtraOrders()).filter((s) => s.accountId === accountId).map((s) => s.order);
  return [...extra, ...(ORDERS[accountId] ?? [])];
}

export async function getOrderById(accountId: string, orderId: string): Promise<Order | undefined> {
  const orders = await getOrdersForAccount(accountId);
  return orders.find((o) => o.id === orderId);
}

export async function addOrder(accountId: string, order: Order): Promise<void> {
  const store = await cookies();
  const existing = await readExtraOrders();
  existing.unshift({ accountId, order });
  store.set(EXTRA_ORDERS_COOKIE, JSON.stringify(existing), {
    maxAge: MAX_AGE,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });
}
