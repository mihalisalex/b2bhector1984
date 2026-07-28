import { listAllOrders } from "@/lib/runtimeOrders";
import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";

export default async function AdminOrdersPage() {
  const orders = await listAllOrders();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Orders
      </h1>

      {orders.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No orders yet.
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
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const { total } = summarizeOrder(order);
                return (
                  <tr key={order.id} className="border-b border-stone-200 last:border-b-0">
                    <td className="font-mono-tab px-4 py-2.5 text-ink">{order.id}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{order.businessName}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{formatDate(order.placedAt)}</td>
                    <td className="px-3 py-2.5 text-ink-soft">{order.terms.toUpperCase()}</td>
                    <td className="font-mono-tab px-3 py-2.5 text-right font-semibold text-ink">
                      {formatEUR(total)}
                    </td>
                    <td className="px-4 py-2.5">
                      <OrderStatusForm orderId={order.id} status={order.status} />
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
