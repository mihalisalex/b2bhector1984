import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOrderById, getOrderStatusHistory } from "@/lib/runtimeOrders";
import { getStyleById } from "@/lib/data/styles";
import { getBoxType } from "@/lib/data/boxTypes";
import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReorderButton } from "@/components/dashboard/ReorderButton";
import { ClearCartOnMount } from "@/components/dashboard/ClearCartOnMount";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { StatusTimeline } from "@/components/order/StatusTimeline";

export const metadata = { title: "Order Detail", robots: { index: false, follow: false } };

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ justPlaced?: string }>;
}) {
  const { id } = await params;
  const { justPlaced } = await searchParams;
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const order = await getOrderById(account.id, id);
  if (!order) notFound();

  const shipTo = account.shipTo.find((s) => s.id === order.shipToId);
  const statusHistory = await getOrderStatusHistory(order.id);
  const { total, vatTotal, grandTotal, totalBoxes, totalPairs } = summarizeOrder(order);

  const uniqueStyleIds = Array.from(new Set(order.lines.map((l) => l.styleId)));
  const styleEntries = await Promise.all(uniqueStyleIds.map(async (sid) => [sid, await getStyleById(sid)] as const));
  const styleById = new Map(styleEntries);
  const productionLines = order.lines.filter((l) => l.fulfillment === "production");
  // Only "made to order" lines carry a concrete date; "pre-order" lines deliberately have
  // none (timing is confirmed once production is scheduled — see placeOrder). The banner
  // below has to say which of those actually applies, or it points buyers at an expected
  // date that isn't there for a pre-order line.
  const withEta = productionLines.filter((l) => l.productionEta);
  const withoutEta = productionLines.filter((l) => !l.productionEta);

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8 lg:px-10">
      {justPlaced === "1" && <ClearCartOnMount />}

      <nav className="mb-6 text-xs text-ink-soft print:hidden">
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link> / {order.id}
      </nav>

      {justPlaced === "1" && (
        <div className="mb-6 border border-positive/40 bg-positive-100 px-4 py-3 text-sm text-positive print:hidden">
          Proforma invoice generated — this isn&rsquo;t a charge. {account.rep.name} will confirm stock and
          production before it proceeds.
        </div>
      )}

      {productionLines.length > 0 && (
        <div className="mb-6 border border-ember/40 bg-ember-100 px-4 py-3 text-sm text-ember">
          {productionLines.length === 1 ? "One line in this order wasn't" : `${productionLines.length} lines in this order weren't`}{" "}
          fully in stock and {productionLines.length === 1 ? "is" : "are"} in production.{" "}
          {withEta.length > 0 && (
            <>See &ldquo;Status&rdquo; below for the expected date on {withoutEta.length > 0 ? "the made-to-order items" : "each item"}.{" "}</>
          )}
          {withoutEta.length > 0 && (
            <>
              {withEta.length > 0 ? "Pre-order items have" : "These are pre-order, so there's"} no fixed ship date
              yet — {account.rep.name} will confirm timing once production is scheduled.{" "}
            </>
          )}
          Anything not marked is shipping from stock as normal.
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono-tab text-2xl font-bold text-ink">{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">Placed {formatDate(order.placedAt)}</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <ReorderButton order={order} className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white" />
          <a
            href={`/api/orders/${order.id}/invoice`}
            className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
          >
            Download Invoice
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Detail label="Ship to">
          {shipTo ? (
            <>
              {shipTo.label}<br />{shipTo.line1}<br />{shipTo.city}, {shipTo.state} {shipTo.zip}
            </>
          ) : "—"}
        </Detail>
        <Detail label="Terms">{order.terms.toUpperCase()}</Detail>
        <Detail label="Tracking">
          {order.trackingNumber ? `${order.carrier ?? ""} ${order.trackingNumber}`.trim() : "—"}
        </Detail>
        <Detail label="Notes">{order.notes ?? "—"}</Detail>
      </div>

      <div className="mt-8 border border-stone-300 bg-white p-5 print:hidden">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Status History</h2>
        <div className="mt-4">
          <StatusTimeline events={statusHistory} />
        </div>
      </div>

      <div className="mt-8 scroll-thin overflow-x-auto border border-stone-300">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-2.5">Style</th>
              <th className="px-3 py-2.5">Colorway</th>
              <th className="px-3 py-2.5">Box</th>
              <th className="px-3 py-2.5 text-right">Qty</th>
              <th className="px-3 py-2.5 text-right">Unit (per pair)</th>
              <th className="px-4 py-2.5 text-right">Total</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line, i) => {
              const style = styleById.get(line.styleId);
              const colorway = style?.colorways.find((c) => c.id === line.colorwayId);
              const box = getBoxType(line.boxTypeId);
              const lineTotal = line.qty * box.totalPairs * line.unitPrice;
              return (
                <tr key={i} className="border-b border-stone-200 last:border-b-0">
                  <td className="px-4 py-2 text-ink">{style?.name ?? line.styleId}</td>
                  <td className="px-3 py-2 text-ink-soft">{colorway?.name ?? line.colorwayId}</td>
                  <td className="font-mono-tab px-3 py-2 text-ink-soft">{box.label}</td>
                  <td className="font-mono-tab px-3 py-2 text-right tabular-nums text-ink">{line.qty}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{formatEUR(line.unitPrice)}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-ink">
                    {formatEUR(lineTotal)}
                  </td>
                  <td className="px-3 py-2">
                    {line.fulfillment === "production" ? (
                      <span className="whitespace-nowrap text-xs font-medium text-ember">
                        Production{line.productionEta ? ` · ETA ${formatDate(line.productionEta)}` : ""}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft">In stock</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink bg-stone-50">
              <td
                colSpan={3}
                rowSpan={vatTotal > 0 ? 3 : 2}
                className="px-4 py-3 align-top text-xs font-semibold uppercase tracking-wide text-ink-soft"
              >
                {totalBoxes} boxes · {totalPairs} pairs
              </td>
              <td colSpan={2} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-ink-soft">
                Subtotal
              </td>
              <td className="px-4 py-2 text-right text-sm tabular-nums text-ink-soft">{formatEUR(total)}</td>
            </tr>
            {vatTotal > 0 && (
              <tr className="bg-stone-50">
                <td colSpan={2} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-ink-soft">
                  VAT
                </td>
                <td className="px-4 py-2 text-right text-sm tabular-nums text-ink-soft">{formatEUR(vatTotal)}</td>
              </tr>
            )}
            <tr className="bg-stone-50">
              <td colSpan={2} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Order Total
              </td>
              <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-ink">
                {formatEUR(grandTotal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{children}</p>
    </div>
  );
}
