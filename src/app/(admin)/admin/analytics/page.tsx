import { getAnalyticsSummary } from "@/lib/data/analytics";
import { formatEUR } from "@/lib/pricing";

export const metadata = { title: "Analytics", robots: { index: false, follow: false } };

export default async function AdminAnalyticsPage() {
  const { monthlyRevenue, topStyles, reorderRatePct } = await getAnalyticsSummary();
  const maxMonthly = Math.max(1, ...monthlyRevenue.map((m) => m.total));
  const maxStylePairs = Math.max(1, ...topStyles.map((s) => s.pairs));

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Analytics
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="border border-stone-300 bg-white p-5 lg:col-span-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">
            Revenue — last 6 months
          </h2>
          <div className="mt-4 flex flex-col gap-2.5">
            {monthlyRevenue.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-14 shrink-0 font-mono-tab text-xs text-ink-soft">{m.month}</span>
                <div className="h-5 flex-1 bg-stone-100">
                  <div
                    className="h-full bg-ink"
                    style={{ width: `${Math.max(2, (m.total / maxMonthly) * 100)}%` }}
                  />
                </div>
                <span className="w-24 shrink-0 text-right font-mono-tab text-xs font-semibold text-ink">
                  {formatEUR(m.total)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="border border-stone-300 bg-white p-5">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Reorder rate</h2>
          <p className="font-mono-tab mt-3 text-4xl font-bold text-ink">{reorderRatePct}%</p>
          <p className="mt-2 text-xs text-ink-soft">
            Share of buyer accounts with more than one order placed, among accounts with at least one.
          </p>
        </section>
      </div>

      <section className="mt-6 border border-stone-300 bg-white p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Top styles by pairs sold</h2>
        {topStyles.length === 0 ? (
          <p className="mt-4 text-sm text-ink-soft">No orders yet.</p>
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {topStyles.map((s) => (
              <div key={s.styleId} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-xs text-ink">{s.styleName}</span>
                <div className="h-5 flex-1 bg-stone-100">
                  <div
                    className="h-full bg-cinder"
                    style={{ width: `${Math.max(2, (s.pairs / maxStylePairs) * 100)}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right font-mono-tab text-xs text-ink-soft">{s.pairs} pairs</span>
                <span className="w-24 shrink-0 text-right font-mono-tab text-xs font-semibold text-ink">
                  {formatEUR(s.revenue)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
