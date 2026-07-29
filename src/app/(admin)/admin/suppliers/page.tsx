import { getAllSuppliers } from "@/lib/data/suppliers";
import { SuppliersTable } from "@/components/admin/products/SuppliersTable";
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
        <SuppliersTable suppliers={suppliers} />
      )}

      <NewSupplierForm />
    </div>
  );
}
