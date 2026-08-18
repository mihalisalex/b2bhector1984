"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { bulkUpdateOrderStatus } from "@/lib/adminActions";
import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { ListPager } from "@/components/admin/ListPager";
import type { AdminOrder } from "@/lib/runtimeOrders";
import type { OrderStatus } from "@/lib/types";

const PAGE_SIZE = 25;

const STATUSES: OrderStatus[] = ["submitted", "confirmed", "in_production", "shipped", "delivered"];

const STATUS_LABEL: Record<OrderStatus, string> = {
  submitted: "Submitted",
  confirmed: "Confirmed",
  in_production: "In Production",
  shipped: "Shipped",
  delivered: "Delivered",
};

export function AdminOrdersTable({ orders }: { orders: AdminOrder[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [message, setMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  // Drop any selected id that's no longer in the current (filtered/searched)
  // order list — otherwise a bulk action after narrowing the filter can act
  // on rows that are no longer visible on screen.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing selection to the current external order list, not derived render state
    setSelected((prev) => {
      const visibleIds = new Set(orders.map((o) => o.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [orders]);

  const allSelected = orders.length > 0 && orders.every((o) => selected.has(o.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(orders.map((o) => o.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulk() {
    const orderIds = Array.from(selected);
    setMessage(null);
    startTransition(async () => {
      const result = await bulkUpdateOrderStatus(orderIds, bulkStatus);
      setMessage(result.error ?? result.success ?? null);
      if (!result.error) setSelected(new Set());
    });
  }

  // Every order was rendered as a row, unbounded. Same client-side pager the other admin
  // reference tables use (accounts, suppliers, applications). Select-all and the bulk
  // actions deliberately still operate on the whole filtered set, not just this page —
  // narrowing by status and then bulk-updating "all of them" is the actual workflow.
  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageRows = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalsById = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.id, summarizeOrder(o).grandTotal);
    return map;
  }, [orders]);

  return (
    <div>
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-3 border border-stone-300 bg-stone-100 px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {selected.size} selected
          </span>
          <select
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
            className="font-mono-tab border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-signal"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={applyBulk}
            disabled={isPending}
            className="bg-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85 disabled:opacity-50"
          >
            {isPending ? "Applying…" : `Apply to ${selected.size}`}
          </button>
          {message && <p className="text-xs text-ink-soft">{message}</p>}
        </div>
      )}

      <div className="scroll-thin overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-[940px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="px-3 py-2.5">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all orders" />
              </th>
              <th className="px-4 py-2.5">Order</th>
              <th className="px-3 py-2.5">Account</th>
              <th className="px-3 py-2.5">Placed</th>
              <th className="px-3 py-2.5">Terms</th>
              <th className="px-3 py-2.5 text-right">Total (incl. VAT)</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {pageRows.map((order) => (
              <tr key={order.id} className="border-b border-stone-200 last:border-b-0 hover:bg-stone-50">
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(order.id)}
                    onChange={() => toggleOne(order.id)}
                    aria-label={`Select order ${order.id}`}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <Link href={`/admin/orders/${order.id}`} className="font-mono-tab text-ink hover:underline">
                    {order.id}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-ink-soft">{order.businessName}</td>
                <td className="px-3 py-2.5 text-ink-soft">{formatDate(order.placedAt)}</td>
                <td className="px-3 py-2.5 text-ink-soft">{order.terms.toUpperCase()}</td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                  {formatEUR(totalsById.get(order.id) ?? 0)}
                </td>
                <td className="px-4 py-2.5">
                  <OrderStatusForm orderId={order.id} status={order.status} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Link href={`/admin/orders/${order.id}`} className="text-xs font-medium text-ink-soft hover:text-ink">
                    Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ListPager
        page={currentPage}
        pageCount={pageCount}
        total={orders.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />
    </div>
  );
}
