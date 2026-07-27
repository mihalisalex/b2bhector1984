import { QuickOrderTable } from "@/components/catalog/QuickOrderTable";

export const metadata = { title: "Quick Order", robots: { index: false, follow: false } };

export default function QuickOrderPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
      <div className="mb-6 border-b border-stone-300 pb-6">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Quick Order</h1>
        <p className="mt-1 max-w-xl text-sm text-ink-soft">
          Already know what you want? Enter SKU, box size, and quantity directly. SKUs follow the pattern
          style-number–colorway, e.g. <span className="font-mono-tab">HR-1001-CIN</span>. Footwear ships in
          8, 10, or 12-pair boxes only — check the linesheet if you need to look a SKU up.
        </p>
      </div>
      <QuickOrderTable />
    </div>
  );
}
