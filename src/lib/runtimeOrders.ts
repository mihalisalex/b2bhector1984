import "server-only";
import { supabaseAdmin } from "@/lib/supabase/server";
import { fromDbId, toDbId, toNumber } from "@/lib/data/dbIds";
import { applyOrderLineStockDelta } from "@/lib/data/inventory";
import type { BoxTypeId, CreditTerms, Order, OrderLine, OrderStatusEvent } from "@/lib/types";

interface OrderRow {
  id: string;
  account_id: string;
  placed_at: string;
  status: Order["status"];
  terms: Order["terms"];
  ship_to_id: string | null;
  notes: string | null;
  invoice_url: string | null;
  tracking_number: string | null;
  carrier: string | null;
  po_number: string | null;
}

interface OrderLineRow {
  id: string;
  order_id: string;
  style_id: string;
  colorway_id: string;
  box_type_id: BoxTypeId;
  qty: number;
  unit_price: number | string;
  vat_rate: number | string | null;
  fulfillment?: string | null;
  production_eta?: string | null;
}

function mapOrder(accountId: string, row: OrderRow, lineRows: OrderLineRow[]): Order {
  const lines: OrderLine[] = lineRows
    .filter((l) => l.order_id === row.id)
    .map((l) => ({
      id: l.id,
      styleId: l.style_id,
      colorwayId: fromDbId(l.style_id, l.colorway_id),
      boxTypeId: l.box_type_id,
      qty: l.qty,
      unitPrice: toNumber(l.unit_price),
      // `?? 0` covers both a genuine null and the column being entirely absent
      // pre-migration 0026 (select("*") just omits an unknown column rather
      // than erroring) — either way, no VAT is the correct pre-migration answer.
      vatRate: toNumber(l.vat_rate ?? 0),
      // Same graceful-default principle for orders placed (or read) before migration
      // 0030 — no column yet means every line was, definitionally, fulfilled from stock.
      fulfillment: (l.fulfillment as "stock" | "production" | null | undefined) ?? "stock",
      productionEta: l.production_eta ?? undefined,
    }));

  return {
    id: row.id,
    placedAt: row.placed_at,
    status: row.status,
    terms: row.terms,
    shipToId: row.ship_to_id ? fromDbId(accountId, row.ship_to_id) : "",
    notes: row.notes ?? undefined,
    lines,
    invoiceUrl: row.invoice_url ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    carrier: row.carrier ?? undefined,
    // Read-only for now: `orders.po_number` has existed since 0001 and holds real
    // values on older orders, but nothing in checkout captures one any more (0029
    // dropped its NOT NULL for exactly that reason). It was never mapped out of the
    // row, which is why the admin order search advertised "PO #" and could not
    // possibly match it. Surfacing it here makes that promise true for the orders
    // that do carry one, and means a future checkout field needs no search work.
    poNumber: row.po_number?.trim() || undefined,
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

/**
 * `orders.id` was already taken. Distinguished from every other insert failure so
 * `placeOrder` can retry with a fresh id — and *only* for that reason: retrying a
 * genuine failure (a bad ship-to FK, a constraint violation, a DB outage) would just
 * re-run the same broken write. Nothing has been written when this is thrown, since the
 * `orders` row is the first insert, so a retry starts from a clean slate.
 */
export class DuplicateOrderIdError extends Error {
  constructor(public readonly orderId: string) {
    super(`orders: id ${orderId} already exists`);
    this.name = "DuplicateOrderIdError";
  }
}

/** Postgres `unique_violation`. */
const PG_UNIQUE_VIOLATION = "23505";

export async function addOrder(accountId: string, order: Order): Promise<void> {
  const { error: orderError } = await supabaseAdmin.from("orders").insert({
    id: order.id,
    account_id: accountId,
    placed_at: order.placedAt,
    status: order.status,
    terms: order.terms,
    ship_to_id: order.shipToId ? toDbId(accountId, order.shipToId) : null,
    notes: order.notes ?? null,
    invoice_url: order.invoiceUrl ?? null,
  });
  if (orderError) {
    if (orderError.code === PG_UNIQUE_VIOLATION) throw new DuplicateOrderIdError(order.id);
    throw new Error(`orders: ${orderError.message}`);
  }

  await supabaseAdmin.from("order_status_history").insert({ order_id: order.id, status: order.status });

  if (order.lines.length === 0) return;
  const baseRows = order.lines.map((line) => ({
    order_id: order.id,
    style_id: line.styleId,
    colorway_id: toDbId(line.styleId, line.colorwayId),
    box_type_id: line.boxTypeId,
    qty: line.qty,
    unit_price: line.unitPrice,
  }));

  // Unlike a read (select("*") just silently omits a column that doesn't
  // exist yet), an INSERT naming an unknown column errors outright — so
  // writing vat_rate/fulfillment/production_eta unconditionally would break
  // every checkout the moment this shipped, not just degrade gracefully,
  // until the migration that added them runs. Try with them first; if that's
  // the specific reason it failed, fall back to the pre-migration shape so
  // placing an order never breaks over a column a feature added.
  const { error: linesError } = await supabaseAdmin.from("order_lines").insert(
    baseRows.map((row, i) => ({
      ...row,
      vat_rate: order.lines[i].vatRate,
      fulfillment: order.lines[i].fulfillment,
      production_eta: order.lines[i].productionEta ?? null,
    })),
  );

  if (linesError) {
    const message = linesError.message;
    const isMissingColumn = message.includes("schema cache") || message.includes("Could not find") || message.includes("column");
    if (!isMissingColumn) {
      await deleteOrphanOrder(order.id);
      throw new Error(`order_lines: ${message}`);
    }

    const { error: fallbackError } = await supabaseAdmin.from("order_lines").insert(baseRows);
    if (fallbackError) {
      await deleteOrphanOrder(order.id);
      throw new Error(`order_lines: ${fallbackError.message}`);
    }
  }
}

/**
 * Removes an `orders` row whose line items failed to insert. Without this, a failed
 * checkout left a real, buyer-visible order with zero line items behind — priced at €0,
 * counted in the admin dashboard, and impossible to fulfil. `order_lines` and
 * `order_status_history` both cascade on `order_id`, so deleting the parent is enough.
 *
 * Best-effort: this runs while an error is already being thrown, so a cleanup failure is
 * logged rather than raised — the caller's original, more useful error must win.
 */
async function deleteOrphanOrder(orderId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("orders").delete().eq("id", orderId);
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error(`[orders] FAILED to clean up line-less order ${orderId} — needs manual removal:`, err);
  }
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

/** Shipping requires tracking info to already be saved (see OrderDetailsForm) — a real carrier/tracking number, not a status flip with no way to actually track the box. */
export async function updateOrderStatus(orderId: string, status: Order["status"]): Promise<{ error?: string }> {
  if (status === "shipped") {
    const { data, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("tracking_number, carrier")
      .eq("id", orderId)
      .limit(1);
    if (fetchError) throw new Error(`orders: ${fetchError.message}`);
    const row = data?.[0];
    if (!row?.tracking_number || !row?.carrier) {
      return { error: "Add a tracking number and carrier in Order Details before marking this shipped." };
    }
  }

  const { error } = await supabaseAdmin.from("orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(`orders: ${error.message}`);
  await supabaseAdmin.from("order_status_history").insert({ order_id: orderId, status });
  return {};
}

export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusEvent[]> {
  const { data, error } = await supabaseAdmin
    .from("order_status_history")
    .select("status, changed_at")
    .eq("order_id", orderId)
    .order("changed_at", { ascending: true });
  if (error) throw new Error(`order_status_history: ${error.message}`);
  return (data ?? []).map((row) => ({ status: row.status, changedAt: row.changed_at }));
}

export interface AdminOrderDetail extends Order {
  accountId: string;
  businessName: string;
  contactName: string;
  email: string;
}

/** Single order for the admin detail/edit view, joined with the buyer's contact info. */
export async function getOrderByIdAdmin(orderId: string): Promise<AdminOrderDetail | undefined> {
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select("*, accounts(business_name, contact_name, email)")
    .eq("id", orderId)
    .limit(1);
  if (error) throw new Error(`orders: ${error.message}`);
  const row = data?.[0] as (OrderRow & { accounts: { business_name: string; contact_name: string; email: string } | null }) | undefined;
  if (!row) return undefined;

  const lineRows = await fetchLines([row.id]);
  const order = mapOrder(row.account_id, row, lineRows);
  return {
    ...order,
    accountId: row.account_id,
    businessName: row.accounts?.business_name ?? row.account_id,
    contactName: row.accounts?.contact_name ?? "",
    email: row.accounts?.email ?? "",
  };
}

/** Admin-editable order metadata — everything except status (see `updateOrderStatus`) and line items. */
export async function updateOrderDetails(
  orderId: string,
  accountId: string,
  input: {
    terms: CreditTerms;
    shipToId: string;
    notes?: string;
    invoiceUrl?: string;
    trackingNumber?: string;
    carrier?: string;
  },
): Promise<void> {
  const { error } = await supabaseAdmin
    .from("orders")
    .update({
      terms: input.terms,
      ship_to_id: input.shipToId ? toDbId(accountId, input.shipToId) : null,
      notes: input.notes || null,
      invoice_url: input.invoiceUrl || null,
      tracking_number: input.trackingNumber || null,
      carrier: input.carrier || null,
    })
    .eq("id", orderId);
  if (error) throw new Error(`orders: ${error.message}`);
}

/** The order-line fields needed to keep stock in step with an edit. */
async function getLineForStockAdjust(lineId: string) {
  const { data, error } = await supabaseAdmin
    .from("order_lines")
    .select("id, order_id, style_id, colorway_id, box_type_id, qty, fulfillment")
    .eq("id", lineId)
    .limit(1);
  if (error) throw new Error(`order_lines: ${error.message}`);
  return data?.[0] as
    | { id: string; order_id: string; style_id: string; colorway_id: string; box_type_id: BoxTypeId; qty: number; fulfillment: string | null }
    | undefined;
}

/**
 * Changes a line's quantity **and moves stock to match**.
 *
 * Checkout decrements `on_hand` at placement, so an admin lowering a line has to put the
 * difference back and raising one has to take more — otherwise every correction leaked
 * stock. Only `"stock"` lines are adjusted; `"production"` lines never consumed `on_hand`.
 *
 * Refuses (rather than writing a quantity the warehouse can't meet) when an increase isn't
 * covered by available stock. The stock move happens first for exactly that reason: if it
 * fails, nothing has been written yet.
 */
export async function updateOrderLineQty(lineId: string, qty: number, actorAccountId: string | null = null): Promise<{ error?: string }> {
  const line = await getLineForStockAdjust(lineId);
  if (!line) return { error: "That line no longer exists." };

  const fulfillment = line.fulfillment ?? "stock";
  if (fulfillment === "stock" && qty !== line.qty) {
    const { ok } = await applyOrderLineStockDelta({
      styleId: line.style_id,
      colorwayDbId: line.colorway_id,
      boxTypeId: line.box_type_id,
      delta: qty - line.qty, // positive takes stock, negative puts it back
      reason: "order_line_edited",
      actorAccountId,
    });
    if (!ok) {
      return { error: `Not enough stock to raise this line to ${qty}. Lower the quantity or restock first.` };
    }
  }

  const { error } = await supabaseAdmin.from("order_lines").update({ qty }).eq("id", lineId);
  if (error) throw new Error(`order_lines: ${error.message}`);
  return {};
}

/**
 * Refuses to delete an order's last remaining line — an order needs at least one.
 *
 * Puts the line's stock back first (see `updateOrderLineQty`): the quantity was taken out
 * of `on_hand` when the order was placed, so removing the line without restoring it left
 * that stock permanently unavailable. Restore happens before the delete so the row is still
 * there to read the style/colorway/qty from.
 */
export async function deleteOrderLine(lineId: string, actorAccountId: string | null = null): Promise<{ error?: string }> {
  const line = await getLineForStockAdjust(lineId);
  if (!line) return {};
  const orderId = line.order_id;

  const { count, error: countError } = await supabaseAdmin
    .from("order_lines")
    .select("id", { count: "exact", head: true })
    .eq("order_id", orderId);
  if (countError) throw new Error(`order_lines: ${countError.message}`);
  if ((count ?? 0) <= 1) return { error: "An order needs at least one line item." };

  if ((line.fulfillment ?? "stock") === "stock") {
    await applyOrderLineStockDelta({
      styleId: line.style_id,
      colorwayDbId: line.colorway_id,
      boxTypeId: line.box_type_id,
      delta: -line.qty, // negative puts stock back
      reason: "order_line_deleted",
      actorAccountId,
    });
  }

  const { error } = await supabaseAdmin.from("order_lines").delete().eq("id", lineId);
  if (error) throw new Error(`order_lines: ${error.message}`);
  return {};
}
