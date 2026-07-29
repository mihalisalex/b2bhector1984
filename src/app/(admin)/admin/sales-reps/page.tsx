import { getAllSalesReps } from "@/lib/data/salesReps";
import { SalesRepsTable } from "@/components/admin/SalesRepsTable";
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
        <SalesRepsTable reps={reps} />
      )}

      <NewSalesRepForm />
    </div>
  );
}
