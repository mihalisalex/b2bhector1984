import { getAllSalesReps } from "@/lib/data/salesReps";
import { SalesRepRow } from "@/components/admin/SalesRepRow";
import { NewSalesRepForm } from "@/components/admin/NewSalesRepForm";

export const metadata = { title: "Sales Reps", robots: { index: false, follow: false } };

export default async function AdminSalesRepsPage() {
  const reps = await getAllSalesReps();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Sales Reps
      </h1>

      {reps.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No sales reps yet.
        </div>
      ) : (
        <div className="scroll-thin mt-6 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-3 py-2.5 font-semibold">Details</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reps.map((rep) => (
                <SalesRepRow key={rep.id} rep={rep} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewSalesRepForm />
    </div>
  );
}
