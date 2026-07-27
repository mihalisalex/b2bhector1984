import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getAssortmentsForAccount } from "@/lib/data/assortments";
import { getAllStyles } from "@/lib/data/styles";
import { formatDate } from "@/lib/format";
import { StylePlate } from "@/components/product/StylePlate";
import { AvailabilityBadge } from "@/components/ui/Badge";

export const metadata = { title: "Saved Assortments", robots: { index: false, follow: false } };

export default async function AssortmentsPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");
  const [assortments, styles] = await Promise.all([
    getAssortmentsForAccount(account.id),
    getAllStyles(),
  ]);
  const styleById = new Map(styles.map((s) => [s.id, s]));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <nav className="mb-4 text-xs text-ink-soft">
        <Link href="/dashboard" className="hover:text-ink">Dashboard</Link> / Saved Assortments
      </nav>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Saved Assortments
      </h1>

      {assortments.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center">
          <p className="text-sm text-ink-soft">
            No saved assortments yet. Build a set of styles you order together and ask your rep to save it here.
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {assortments.map((a) => (
            <section key={a.id}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{a.name}</h2>
                <span className="text-xs text-ink-soft">Saved {formatDate(a.createdAt)}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {a.styleIds.map((id) => {
                  const style = styleById.get(id);
                  if (!style) return null;
                  return (
                    <Link key={id} href={`/product/${style.slug}`} className="group border border-stone-300 bg-white">
                      <StylePlate
                        swatch={style.colorways[0].swatch}
                        imageUrl={style.primaryImageUrl}
                        className="aspect-[4/3] w-full"
                        dense
                      />
                      <div className="p-3">
                        <AvailabilityBadge availability={style.availability} shipWindow={style.shipWindow} />
                        <p className="font-display mt-2 text-sm font-bold uppercase text-ink group-hover:underline">{style.name}</p>
                        <p className="font-mono-tab text-[11px] text-ink-soft">{style.styleNumber}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
