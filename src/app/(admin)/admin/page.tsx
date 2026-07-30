import { listAllOrders } from "@/lib/runtimeOrders";
import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { cn } from "@/lib/cn";
import { AdminOrderFilters } from "@/components/admin/AdminOrderFilters";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { OrdersCsvExportButton } from "@/components/admin/OrdersCsvExportButton";

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
          Orders
        </h1>
        <OrdersCsvExportButton orders={orders} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total orders" value={String(allOrders.length)} />
        <StatCard label="Total revenue" value={formatEUR(totalRevenue)} isPrice />
        <StatCard label="Awaiting action" value={String(awaitingAction)} highlight={awaitingAction > 0} />
        <StatCard label="Active buyers" value={String(activeBuyers)} />
      </div>

      <AdminOrderFilters />

      {orders.length === 0 ? (
        <div className="mt-6 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          {allOrders.length === 0 ? "No orders yet." : "No orders match this search."}
        </div>
      ) : (
        <div className="mt-6">
          <AdminOrdersTable orders={orders} />
        </div>
      )}
    </div>
  );
}

/** `isPrice` drops the monospace treatment — that font is for utilitarian counts/ids, not a currency figure. */
function StatCard({
  label,
  value,
  highlight,
  isPrice,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  isPrice?: boolean;
}) {
  return (
    <div className="border border-stone-300 bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-xl font-bold tabular-nums",
          !isPrice && "font-mono-tab",
          highlight ? "text-ember" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}
