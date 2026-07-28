import { formatEUR } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import type { StyleAnalytics } from "@/lib/data/styleAnalytics";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-stone-300 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="font-mono-tab mt-1 text-xl text-ink">{value}</p>
    </div>
  );
}

export function AnalyticsTab({ analytics }: { analytics: StyleAnalytics }) {
  const maxRevenue = Math.max(1, ...analytics.salesGraph.map((p) => p.revenue));

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Views" value={String(analytics.views)} />
        <StatTile label="Orders" value={String(analytics.orders)} />
        <StatTile label="Revenue" value={formatEUR(analytics.revenue)} />
        <StatTile label="Profit" value={formatEUR(analytics.profit)} />
        <StatTile label="Conversion rate" value={`${analytics.conversionRatePct}%`} />
        <StatTile label="Inventory turnover" value={`${analytics.inventoryTurnover}x`} />
        <StatTile label="Returns" value="Not tracked" />
        <StatTile label="Pairs sold" value={String(analytics.pairsSold)} />
      </div>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Sales, last 6 months</h3>
        <div className="mt-3 flex items-end gap-3 border border-stone-300 bg-white px-4 py-4">
          {analytics.salesGraph.map((point) => (
            <div key={point.month} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-32 w-full items-end">
                <div className="w-full bg-ink" style={{ height: `${Math.max(2, (point.revenue / maxRevenue) * 100)}%` }} title={formatEUR(point.revenue)} />
              </div>
              <span className="text-[10px] uppercase tracking-wide text-ink-soft">{point.month}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Top customers</h3>
        <div className="mt-3 divide-y divide-stone-200 border border-stone-300 bg-white">
          {analytics.topCustomers.map((c) => (
            <div key={c.accountId} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-ink">{c.businessName}</span>
              <span className="text-ink-soft">{c.pairs} pairs</span>
              <span className="font-mono-tab text-ink">{formatEUR(c.revenue)}</span>
            </div>
          ))}
          {analytics.topCustomers.length === 0 && <p className="px-4 py-4 text-sm text-ink-soft">No orders yet.</p>}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Recent purchases</h3>
        <div className="mt-3 divide-y divide-stone-200 border border-stone-300 bg-white">
          {analytics.recentPurchases.map((p) => (
            <div key={p.orderId} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-mono-tab text-ink-soft">{p.orderId}</span>
              <span className="text-ink">{p.businessName}</span>
              <span className="text-ink-soft">{formatDate(p.placedAt)}</span>
              <span className="font-mono-tab text-ink">{formatEUR(p.revenue)}</span>
            </div>
          ))}
          {analytics.recentPurchases.length === 0 && <p className="px-4 py-4 text-sm text-ink-soft">No orders yet.</p>}
        </div>
      </section>
    </div>
  );
}
