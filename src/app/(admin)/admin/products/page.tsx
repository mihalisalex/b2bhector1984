import Link from "next/link";
import { countStylesMissingGreekCopy, listProductsForAdmin } from "@/lib/data/productAdmin";
import { getAllBrands } from "@/lib/data/brands";
import { getAllSuppliers } from "@/lib/data/suppliers";
import { CATEGORY_LABEL } from "@/lib/data/styleLabels";
import { ProductFilterBar } from "@/components/admin/products/ProductFilterBar";
import { ProductsBrowser } from "@/components/admin/products/ProductsBrowser";
import { Pagination } from "@/components/admin/products/Pagination";
import type { ProductListParams } from "@/lib/data/productAdmin";

export const metadata = { title: "Products — Admin" };

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
    brandId: firstParam(sp, "brand"),
    supplierId: firstParam(sp, "supplier"),
    inventory: (firstParam(sp, "inventory") as ProductListParams["inventory"]) ?? "all",
    sort: (firstParam(sp, "sort") as ProductListParams["sort"]) ?? "newest",
    page: Number(firstParam(sp, "page") ?? "1") || 1,
    pageSize: Number(firstParam(sp, "pageSize") ?? "25") || 25,
  };
  const view = firstParam(sp, "view") === "grid" ? "grid" : "table";

  const [{ items, total, page, pageSize }, brands, suppliers, greekGap] = await Promise.all([
    listProductsForAdmin(params),
    getAllBrands(),
    getAllSuppliers(),
    countStylesMissingGreekCopy(),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-300 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">Products</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {total} product{total === 1 ? "" : "s"} in the catalog.
            {/* Catalogue-wide, deliberately unaffected by the current filter — this is the
                go/no-go number for the Greek launch, so it has to mean the same thing every
                time it is read. The browser's own badge counts the filtered page. */}
            {greekGap > 0 && (
              <>
                {" "}
                <span className="font-semibold text-signal">
                  {greekGap} still need Greek copy.
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
            Import
          </Link>
          <Link
            href="/admin/products/new"
            className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
          >
            Add Product
          </Link>
        </div>
      </div>

      <ProductFilterBar
        categories={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))}
        brands={brands}
        suppliers={suppliers}
        view={view}
      />

      <div className="mt-6">
        <ProductsBrowser items={items} view={view} brands={brands} suppliers={suppliers} />
      </div>

      <Pagination total={total} page={page} pageSize={pageSize} />
    </div>
  );
}
