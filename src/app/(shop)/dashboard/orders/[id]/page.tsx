import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOrderById } from "@/lib/runtimeOrders";
import { getStyleById } from "@/lib/data/styles";
import { getBoxType } from "@/lib/data/boxTypes";
import { formatUSD, summarizeOrder } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReorderButton } from "@/components/dashboard/ReorderButton";
import { ClearCartOnMount } from "@/components/dashboard/ClearCartOnMount";
import { PrintButton } from "@/components/dashboard/PrintButton";

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
  const { total, totalBoxes, totalPairs } = summarizeOrder(order);

  const uniqueStyleIds = Array.from(new Set(order.lines.map((l) => l.styleId)));
  const styleEntries = await Promise.all(uniqueStyleIds.map(async (sid) => [sid, await getStyleById(sid)] as const));
  const styleById = new Map(styleEntries);

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

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono-tab text-2xl font-bold text-ink">{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">PO {order.poNumber} · Placed {formatDate(order.placedAt)}</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <ReorderButton order={order} className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white" />
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
        <Detail label="Notes">{order.notes ?? "—"}</Detail>
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
                  <td className="font-mono-tab px-3 py-2 text-right tabular-nums text-ink-soft">{formatUSD(line.unitPrice)}</td>
                  <td className="font-mono-tab px-4 py-2 text-right font-semibold tabular-nums text-ink">
                    {formatUSD(lineTotal)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink bg-stone-50">
              <td colSpan={3} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {totalBoxes} boxes · {totalPairs} pairs
              </td>
              <td colSpan={2} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Order Total
              </td>
              <td className="font-mono-tab px-4 py-3 text-right text-base font-bold tabular-nums text-ink">
                {formatUSD(total)}
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
