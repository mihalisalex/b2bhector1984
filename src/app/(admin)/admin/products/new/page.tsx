import Link from "next/link";
import { NewProductForm } from "@/components/admin/products/NewProductForm";

export const metadata = { title: "Νέο προϊόν — Admin" };

export default function NewProductPage() {
  return (
    <div>
      <nav className="mb-4 text-xs text-ink-soft">
        <Link href="/admin/products" className="hover:text-ink">Προϊόντα</Link> / Νέο προϊόν
      </nav>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Νέο προϊόν
      </h1>
      <NewProductForm />
    </div>
  );
}
