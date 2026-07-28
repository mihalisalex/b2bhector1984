import Link from "next/link";
import { getAllStyles } from "@/lib/data/styles";
import { StylePlate } from "@/components/product/StylePlate";

export default async function AdminStylesPage() {
  const styles = await getAllStyles();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Styles
      </h1>
      <p className="mt-2 text-sm text-ink-soft">Upload and manage product photography per style.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {styles.map((style) => (
          <Link key={style.id} href={`/admin/styles/${style.id}`} className="group block border border-stone-300 bg-white">
            <StylePlate swatch={style.colorways[0].swatch} imageUrl={style.primaryImageUrl} alt={style.name} className="aspect-[4/3] w-full" dense />
            <div className="p-3">
              <p className="text-sm font-semibold text-ink group-hover:underline">{style.name}</p>
              <p className="font-mono-tab text-[11px] text-ink-soft">{style.styleNumber}</p>
              <p className="mt-1 text-[11px] text-ink-soft">
                {style.primaryImageUrl ? "Photo uploaded" : "No photo yet"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
