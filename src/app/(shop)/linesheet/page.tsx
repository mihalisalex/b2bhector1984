import { Suspense } from "react";
import Link from "next/link";
import { STYLES, CATEGORY_LABEL, GENDER_LABEL } from "@/lib/data/styles";
import { getCurrentAccount } from "@/lib/session";
import { filterStyles, parseFilters } from "@/lib/catalogFilters";
import { formatUSD, getPriceBreakTable } from "@/lib/pricing";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
import { LinesheetToolbar } from "@/components/catalog/LinesheetToolbar";
import { AvailabilityBadge } from "@/components/ui/Badge";

export const metadata = { title: "Digital Linesheet", robots: { index: false, follow: false } };

export default async function LinesheetPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const account = await getCurrentAccount();
  const tier = account!.tier;
  const filters = parseFilters(sp);
  const results = filterStyles(STYLES, filters, (s) => getPriceBreakTable(s, tier)[0].price);

  return (
    <div className="mx-auto max-w-[1800px] px-6 py-8 lg:px-10 print:px-0 print:py-0">
      <div className="mb-6 flex flex-col gap-3 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Digital Linesheet</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Full collection, one row per style. Priced at your {tier} tier.
          </p>
        </div>
        <LinesheetToolbar styles={results} tier={tier} />
      </div>

      <div className="mb-6 hidden print:block">
        <p className="font-display text-xl font-bold uppercase">Hector 1984 — Wholesale Linesheet</p>
        <p className="font-mono-tab text-xs text-ink-soft">
          {account?.businessName} · {tier} tier · {new Date().toLocaleDateString("en-US")}
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="print:hidden">
          <Suspense fallback={null}>
            <CatalogFilters resultCount={results.length} />
          </Suspense>
        </div>

        <div className="min-w-0 flex-1">
          {results.length === 0 ? (
            <div className="border border-dashed border-stone-300 bg-stone-100 px-6 py-20 text-center">
              <p className="font-display text-lg font-bold uppercase text-ink">No styles match this filter</p>
              <p className="mt-2 text-sm text-ink-soft">Clear a filter to see more of the collection.</p>
            </div>
          ) : (
            <div className="scroll-thin overflow-x-auto border border-stone-300">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-stone-300 bg-stone-100 text-left">
                    <Th>Style</Th>
                    <Th>Category</Th>
                    <Th>Colorways</Th>
                    <Th>Boxes</Th>
                    <Th align="right">Min boxes</Th>
                    <Th align="right">Entry price</Th>
                    <Th align="right">Best price</Th>
                    <Th>Delivery</Th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((s) => {
                    const breaks = getPriceBreakTable(s, tier);
                    return (
                      <tr key={s.id} className="border-b border-stone-200 last:border-b-0 even:bg-stone-50/60 hover:bg-signal-100/40">
                        <td className="px-3 py-2.5">
                          <Link href={`/product/${s.slug}`} className="font-medium text-ink hover:underline">
                            {s.name}
                          </Link>
                          <p className="font-mono-tab text-[11px] text-ink-soft">
                            {s.styleNumber} · {GENDER_LABEL[s.gender]}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-ink-soft">{CATEGORY_LABEL[s.category]}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1">
                            {s.colorways.map((c) => (
                              <span key={c.id} className="flex h-4 w-6 overflow-hidden border border-stone-300" title={c.name}>
                                <span className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                                <span className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="font-mono-tab px-3 py-2.5 text-xs text-ink-soft">8 / 10 / 12-pr</td>
                        <td className="font-mono-tab px-3 py-2.5 text-right tabular-nums text-ink">{s.moqBoxes}</td>
                        <td className="font-mono-tab px-3 py-2.5 text-right font-semibold tabular-nums text-ink">
                          {formatUSD(breaks[0].price)}
                        </td>
                        <td className="font-mono-tab px-3 py-2.5 text-right tabular-nums text-positive">
                          {formatUSD(breaks[breaks.length - 1].price)}
                        </td>
                        <td className="px-3 py-2.5">
                          <AvailabilityBadge availability={s.availability} shipWindow={s.shipWindow} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`px-3 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft ${align === "right" ? "text-right" : ""}`}>
      {children}
    </th>
  );
}
