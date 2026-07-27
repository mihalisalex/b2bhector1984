import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toDbId, toNumber } from "@/lib/data/dbIds";
import type { BoxTypeId, Order, OrderLine } from "@/lib/types";

interface OrderRow {
  id: string;
  account_id: string;
  po_number: string;
  placed_at: string;
  status: Order["status"];
  terms: Order["terms"];
  ship_to_id: string | null;
  notes: string | null;
  invoice_url: string | null;
}

interface OrderLineRow {
  order_id: string;
  style_id: string;
  colorway_id: string;
  box_type_id: BoxTypeId;
  qty: number;
  unit_price: number | string;
}

function mapOrder(accountId: string, row: OrderRow, lineRows: OrderLineRow[]): Order {
  const lines: OrderLine[] = lineRows
    .filter((l) => l.order_id === row.id)
    .map((l) => ({
      styleId: l.style_id,
      colorwayId: fromDbId(l.style_id, l.colorway_id),
      boxTypeId: l.box_type_id,
      qty: l.qty,
      unitPrice: toNumber(l.unit_price),
    }));

  return {
    id: row.id,
    poNumber: row.po_number,
    placedAt: row.placed_at,
    status: row.status,
    terms: row.terms,
    shipToId: row.ship_to_id ? fromDbId(accountId, row.ship_to_id) : "",
    notes: row.notes ?? undefined,
    lines,
    invoiceUrl: row.invoice_url ?? undefined,
  };
}

async function fetchLines(orderIds: string[]): Promise<OrderLineRow[]> {
  if (orderIds.length === 0) return [];
  const { data, error } = await supabaseAdmin.from("order_lines").select("*").in("order_id", orderIds);
  if (error) throw new Error(`order_lines: ${error.message}`);
  return data ?? [];
}

export async function getOrdersForAccount(accountId: string): Promise<Order[]> {
  const { data: orderRows, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("account_id", accountId)
    .order("placed_at", { ascending: false });
  if (error) throw new Error(`orders: ${error.message}`);

  const lineRows = await fetchLines((orderRows ?? []).map((o) => o.id));
  return (orderRows ?? []).map((row) => mapOrder(accountId, row, lineRows));
}

export async function getOrderById(accountId: string, orderId: string): Promise<Order | undefined> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("account_id", accountId)
    .limit(1);
  if (error) throw new Error(`orders: ${error.message}`);
  const row = data?.[0] as OrderRow | undefined;
  if (!row) return undefined;

  const lineRows = await fetchLines([row.id]);
  return mapOrder(accountId, row, lineRows);
}

export async function addOrder(accountId: string, order: Order): Promise<void> {
  const { error: orderError } = await supabaseAdmin.from("orders").insert({
    id: order.id,
    account_id: accountId,
    po_number: order.poNumber,
    placed_at: order.placedAt,
    status: order.status,
    terms: order.terms,
    ship_to_id: order.shipToId ? toDbId(accountId, order.shipToId) : null,
    notes: order.notes ?? null,
    invoice_url: order.invoiceUrl ?? null,
  });
  if (orderError) throw new Error(`orders: ${orderError.message}`);

  if (order.lines.length === 0) return;
  const { error: linesError } = await supabaseAdmin.from("order_lines").insert(
    order.lines.map((line) => ({
      order_id: order.id,
      style_id: line.styleId,
      colorway_id: toDbId(line.styleId, line.colorwayId),
      box_type_id: line.boxTypeId,
      qty: line.qty,
      unit_price: line.unitPrice,
    })),
  );
  if (linesError) throw new Error(`order_lines: ${linesError.message}`);
}

export interface AdminOrder extends Order {
  accountId: string;
  businessName: string;
}

/** All orders across every account, for the admin dashboard. */
export async function listAllOrders(): Promise<AdminOrder[]> {
  const { data: orderRows, error } = await supabaseAdmin
    .from("orders")
    .select("*, accounts(business_name)")
    .order("placed_at", { ascending: false });
  if (error) throw new Error(`orders: ${error.message}`);

  const lineRows = await fetchLines((orderRows ?? []).map((o) => o.id));
  return (orderRows ?? []).map((row) => ({
    ...mapOrder(row.account_id, row, lineRows),
    accountId: row.account_id,
    businessName: (row as unknown as { accounts: { business_name: string } | null }).accounts?.business_name ?? row.account_id,
  }));
}

export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<void> {
  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(`orders: ${error.message}`);
}
