import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByIdAdmin } from "@/lib/runtimeOrders";
import { getAccountById } from "@/lib/data/accounts";
import { getStyleById } from "@/lib/data/styles";
import { getBoxType } from "@/lib/data/boxTypes";
import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { formatDate, telHref } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { OrderDetailsForm } from "@/components/admin/OrderDetailsForm";
import { OrderLineRow } from "@/components/admin/OrderLineRow";
import { EmailBuyerPanel } from "@/components/admin/EmailBuyerPanel";

export const metadata = { title: "Order", robots: { index: false, follow: false } };

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderByIdAdmin(id);
  if (!order) notFound();

  const account = await getAccountById(order.accountId);
  const { total, totalBoxes, totalPairs } = summarizeOrder(order);

  const uniqueStyleIds = Array.from(new Set(order.lines.map((l) => l.styleId)));
  const styleEntries = await Promise.all(uniqueStyleIds.map(async (sid) => [sid, await getStyleById(sid)] as const));
  const styleById = new Map(styleEntries);

  const emailBody = `Hi ${order.contactName.split(" ")[0] || "there"},\n\nWriting about your order ${order.id} (PO ${order.poNumber}), currently ${order.status.replace("_", " ")}.\n\n\n\nBest,\nHector 1984 Wholesale`;

  return (
    <div>
      <nav className="mb-6 text-xs text-ink-soft">
        <Link href="/admin" className="hover:text-ink">Orders</Link> / {order.id}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono-tab text-2xl font-bold text-ink">{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {order.businessName} · Placed {formatDate(order.placedAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Status</span>
          <OrderStatusForm orderId={order.id} status={order.status} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="border border-stone-300 bg-white p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Order Details</h2>
          <div className="mt-4">
            <OrderDetailsForm
              orderId={order.id}
              accountId={order.accountId}
              poNumber={order.poNumber}
              terms={order.terms}
              shipToId={order.shipToId}
              notes={order.notes}
              invoiceUrl={order.invoiceUrl}
              shipToOptions={account?.shipTo ?? []}
            />
          </div>
        </section>

        <section className="border border-stone-300 bg-ink p-5 text-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-300/70">Buyer</h2>
          <div className="mt-3">
            <p className="text-sm font-semibold text-white">{order.contactName}</p>
            <p className="text-xs text-stone-300/70">{order.businessName}</p>
          </div>
          <div className="mt-3 flex flex-col gap-1 text-xs text-stone-300/80">
            <a href={`mailto:${order.email}`} className="hover:text-white">{order.email}</a>
            {account && (
              <a href={telHref(account.rep.phone)} className="hover:text-white">Rep: {account.rep.name}</a>
            )}
          </div>
          <div className="mt-4">
            <EmailBuyerPanel
              to={order.email}
              toName={order.contactName}
              defaultSubject={`Your Hector 1984 order ${order.id}`}
              defaultBody={emailBody}
            />
          </div>
        </section>
      </div>

      <section className="mt-6 border border-stone-300 bg-white">
        <h2 className="border-b border-stone-300 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Line Items
        </h2>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5">Style</th>
                <th className="px-3 py-2.5">Colorway</th>
                <th className="px-3 py-2.5">Box</th>
                <th className="px-3 py-2.5 text-right">Qty</th>
                <th className="px-3 py-2.5 text-right">Unit (per pair)</th>
                <th className="px-4 py-2.5 text-right">Total</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => {
                const style = styleById.get(line.styleId);
                const colorway = style?.colorways.find((c) => c.id === line.colorwayId);
                const box = getBoxType(line.boxTypeId);
                const lineTotal = line.qty * box.totalPairs * line.unitPrice;
                return (
                  <OrderLineRow
                    key={line.id}
                    orderId={order.id}
                    lineId={line.id!}
                    styleName={style?.name ?? line.styleId}
                    colorwayName={colorway?.name ?? line.colorwayId}
                    boxLabel={box.label}
                    qty={line.qty}
                    unitPrice={line.unitPrice}
                    lineTotal={lineTotal}
                    canDelete={order.lines.length > 1}
                  />
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink bg-stone-50">
                <td colSpan={3} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  {totalBoxes} boxes · {totalPairs} pairs
                </td>
                <td colSpan={3} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  Order Total
                </td>
                <td className="font-mono-tab px-4 py-3 text-right text-base font-bold tabular-nums text-ink">
                  {formatEUR(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
