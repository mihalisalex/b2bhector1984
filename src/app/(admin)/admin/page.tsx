import Link from "next/link";
import { listAllOrders } from "@/lib/runtimeOrders";
import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { AdminOrderFilters } from "@/components/admin/AdminOrderFilters";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const allOrders = await listAllOrders();

  const totalRevenue = allOrders.reduce((sum, o) => sum + summarizeOrder(o).total, 0);
  const awaitingAction = allOrders.filter((o) => o.status === "submitted").length;
  const activeBuyers = new Set(allOrders.map((o) => o.accountId)).size;

  const query = (q ?? "").trim().toLowerCase();
  const orders = allOrders.filter((order) => {
    if (status && order.status !== status) return false;
    if (!query) return true;
    return (
      order.id.toLowerCase().includes(query) ||
      order.poNumber.toLowerCase().includes(query) ||
      order.businessName.toLowerCase().includes(query)
    );
  });

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Orders
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total orders" value={String(allOrders.length)} />
        <StatCard label="Total revenue" value={formatEUR(totalRevenue)} />
        <StatCard label="Awaiting action" value={String(awaitingAction)} highlight={awaitingAction > 0} />
        <StatCard label="Active buyers" value={String(activeBuyers)} />
      </div>

      <AdminOrderFilters />

      {orders.length === 0 ? (
        <div className="mt-6 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          {allOrders.length === 0 ? "No orders yet." : "No orders match this search."}
        </div>
      ) : (
        <div className="scroll-thin mt-6 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5">Order</th>
                <th className="px-3 py-2.5">Account</th>
                <th className="px-3 py-2.5">Placed</th>
                <th className="px-3 py-2.5">Terms</th>
                <th className="px-3 py-2.5 text-right">Total</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const { total } = summarizeOrder(order);
                return (
                  <tr key={order.id} className="border-b border-stone-200 last:border-b-0 hover:bg-stone-50">
                    <td className="px-4 py-2.5">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono-tab text-ink hover:underline">
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-3 py-2.5 text-ink-soft">{order.businessName}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{formatDate(order.placedAt)}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{order.terms.toUpperCase()}</td>
                    <td className="font-mono-tab px-3 py-2.5 text-right font-semibold text-ink">
                      {formatEUR(total)}
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
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="border border-stone-300 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className={`font-mono-tab mt-1.5 text-xl font-bold ${highlight ? "text-ember" : "text-ink"}`}>{value}</p>
    </div>
  );
}
