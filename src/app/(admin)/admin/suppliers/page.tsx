import { getAllSuppliers } from "@/lib/data/suppliers";
import { SupplierRow } from "@/components/admin/products/SupplierRow";
import { NewSupplierForm } from "@/components/admin/products/NewSupplierForm";

export const metadata = { title: "Suppliers", robots: { index: false, follow: false } };

export default async function AdminSuppliersPage() {
  const suppliers = await getAllSuppliers();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Suppliers
      </h1>

      {suppliers.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No suppliers yet.
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
              {suppliers.map((s) => (
                <SupplierRow key={s.id} supplier={s} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <NewSupplierForm />
    </div>
  );
}
