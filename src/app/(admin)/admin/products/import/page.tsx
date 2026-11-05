import Link from "next/link";
import { ImportWizard } from "@/components/admin/products/ImportWizard";

export const metadata = { title: "Εισαγωγή προϊόντων — Admin" };

export default function ImportProductsPage() {
  return (
    <div>
      <nav className="mb-4 text-xs text-ink-soft">
        <Link href="/admin/products" className="hover:text-ink">Προϊόντα</Link> / Εισαγωγή
      </nav>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Εισαγωγή προϊόντων
      </h1>
      <div className="mt-6">
        <ImportWizard />
      </div>
    </div>
  );
}
