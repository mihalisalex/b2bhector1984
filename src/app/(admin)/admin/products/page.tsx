import Link from "next/link";
import { countStylesMissingGreekCopy, listProductsForAdmin } from "@/lib/data/productAdmin";
import { ProductFilterBar } from "@/components/admin/products/ProductFilterBar";
import { ProductsBrowser } from "@/components/admin/products/ProductsBrowser";
import { Pagination } from "@/components/admin/products/Pagination";
import type { ProductListParams } from "@/lib/data/productAdmin";

export const metadata = { title: "Προϊόντα — Admin" };

type SearchParams = Record<string, string | string[] | undefined>;

function firstParam(sp: SearchParams, key: string): string | undefined {
  const v = sp[key];
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;

  const params: ProductListParams = {
    q: firstParam(sp, "q"),
    status: (firstParam(sp, "status") as ProductListParams["status"]) ?? "all",
    category: firstParam(sp, "category"),
    season: firstParam(sp, "season") as ProductListParams["season"],
    missing: firstParam(sp, "missing") as ProductListParams["missing"],
    sort: (firstParam(sp, "sort") as ProductListParams["sort"]) ?? "newest",
    page: Number(firstParam(sp, "page") ?? "1") || 1,
    pageSize: Number(firstParam(sp, "pageSize") ?? "25") || 25,
  };
  const [{ items, total, page, pageSize }, greekGap] = await Promise.all([
    listProductsForAdmin(params),
    countStylesMissingGreekCopy(),
  ]);
  const categories = [
    { value: "boots", label: "Μπότες" },
    { value: "formal", label: "Επίσημα" },
    { value: "wedding", label: "Γαμπριάτικα" },
    { value: "loafers", label: "Loafers" },
    { value: "sneakers", label: "Sneakers" },
    { value: "anatomic", label: "Ανατομικά" },
    { value: "sandals", label: "Σανδάλια" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 pb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Προϊόντα</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {total} προϊόντα.
            {/* Catalogue-wide, deliberately unaffected by the current filter — this is the
                go/no-go number for the Greek launch, so it has to mean the same thing every
                time it is read. The browser's own badge counts the filtered page. */}
            {greekGap > 0 && (
              <>
                {" "}
                <span className="font-semibold text-signal">
                  {greekGap} χωρίς ελληνικά.
                </span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/products/import"
            className="border border-stone-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink"
          >
            Εισαγωγή αρχείου
          </Link>
          <Link
            href="/admin/products/new"
            className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
          >
            Νέο προϊόν
          </Link>
        </div>
      </div>

      <ProductFilterBar categories={categories} />

      <div className="mt-6">
        <ProductsBrowser items={items} />
      </div>

      <Pagination total={total} page={page} pageSize={pageSize} />
    </div>
  );
}
