"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToastResult } from "@/components/ui/ToastProvider";
import { archiveProductAction, deleteProductAction } from "@/lib/productActions";
import { GeneralTab } from "@/components/admin/products/editor/GeneralTab";
import { PricingTab } from "@/components/admin/products/editor/PricingTab";
import { InventoryTab } from "@/components/admin/products/editor/InventoryTab";
import { MediaTab } from "@/components/admin/products/editor/MediaTab";
import { VariantsTab } from "@/components/admin/products/editor/VariantsTab";
import { AttributesTab } from "@/components/admin/products/editor/AttributesTab";
import { ShippingTab } from "@/components/admin/products/editor/ShippingTab";
import { SeoTab } from "@/components/admin/products/editor/SeoTab";
import { RelatedTab } from "@/components/admin/products/editor/RelatedTab";
import { DocumentsTab } from "@/components/admin/products/editor/DocumentsTab";
import { VisibilityTab } from "@/components/admin/products/editor/VisibilityTab";
import { AnalyticsTab } from "@/components/admin/products/editor/AnalyticsTab";
import type { InventoryMovement, ProductPermissionKey, Style, Warehouse } from "@/lib/types";
import type { Brand, Collection, Supplier } from "@/lib/types";
import type { WarehouseStockRow } from "@/lib/data/inventory";
import type { StyleAnalytics } from "@/lib/data/styleAnalytics";
import type { StyleImage } from "@/lib/data/styleImages";

const TABS = [
  "General", "Pricing", "Inventory", "Images & Media", "Variants", "Attributes",
  "Shipping", "SEO", "Related", "Documents", "Visibility", "Analytics",
] as const;
type Tab = (typeof TABS)[number];

const STATUS_LABEL: Record<string, string> = { active: "Active", draft: "Draft", archived: "Archived", private: "Private" };

export function ProductEditorShell({
  style,
  allStyles,
  brands,
  suppliers,
  collections,
  warehouses,
  warehouseStock,
  movements,
  images,
  analytics,
  permissions,
}: {
  style: Style;
  allStyles: Style[];
  brands: Brand[];
  suppliers: Supplier[];
  collections: Collection[];
  warehouses: Warehouse[];
  warehouseStock: WarehouseStockRow[];
  movements: InventoryMovement[];
  images: StyleImage[];
  analytics: StyleAnalytics;
  permissions: Record<ProductPermissionKey, boolean>;
}) {
  const [tab, setTab] = useState<Tab>("General");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const showResult = useToastResult();
  const router = useRouter();

  function handleArchive() {
    startTransition(async () => {
      await archiveProductAction(style.id);
      showResult({ success: `${style.name} archived.` });
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteProductAction(style.id);
      showResult(result);
      if (!result.error) router.push("/admin/products");
      setConfirmingDelete(false);
    });
  }

  return (
    <div>
      <div className="sticky top-0 z-20 -mx-6 border-b border-stone-300 bg-stone-50/95 px-6 pb-4 pt-2 backdrop-blur lg:-mx-10 lg:px-10">
        <nav className="pt-2 text-xs text-ink-soft">
          <Link href="/admin/products" className="hover:text-ink">Products</Link> / {style.name}
        </nav>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold uppercase tracking-tight text-ink">{style.name}</h1>
            <p className="font-mono-tab mt-0.5 text-xs text-ink-soft">
              {style.styleNumber} · <span className="uppercase">{STATUS_LABEL[style.status]}</span>
              {style.featured && " · Featured"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/product/${style.slug}`}
              target="_blank"
              className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink"
            >
              Preview
            </Link>
            {permissions["products.delete"] && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isPending || style.status === "archived"}
                className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink disabled:opacity-40"
              >
                Archive
              </button>
            )}
            {permissions["products.delete"] &&
              (confirmingDelete ? (
                <span className="flex items-center gap-2 border border-ember bg-ember-100 px-2 py-1 text-xs text-ember">
                  Delete permanently?
                  <button type="button" onClick={handleDelete} disabled={isPending} className="font-semibold underline">
                    Yes
                  </button>
                  <button type="button" onClick={() => setConfirmingDelete(false)} className="underline">
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="border border-ember px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember hover:bg-ember-100"
                >
                  Delete
                </button>
              ))}
          </div>
        </div>

        <div role="tablist" className="scroll-thin mt-4 -mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              id={`tab-${t}`}
              role="tab"
              aria-selected={tab === t}
              aria-controls="product-editor-tabpanel"
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors ${
                tab === t ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div id="product-editor-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-6">
        {tab === "General" && (
          <GeneralTab style={style} brands={brands} suppliers={suppliers} collections={collections} canEdit={permissions["products.edit"]} />
        )}
        {tab === "Pricing" && <PricingTab style={style} canEdit={permissions["products.pricing"]} />}
        {tab === "Inventory" && (
          <InventoryTab style={style} warehouses={warehouses} warehouseStock={warehouseStock} movements={movements} canEdit={permissions["products.inventory"]} />
        )}
        {tab === "Images & Media" && <MediaTab style={style} images={images} canEdit={permissions["products.edit"]} />}
        {tab === "Variants" && <VariantsTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Attributes" && <AttributesTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Shipping" && <ShippingTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "SEO" && <SeoTab style={style} canEdit={permissions["products.seo"]} />}
        {tab === "Related" && <RelatedTab style={style} allStyles={allStyles} canEdit={permissions["products.edit"]} />}
        {tab === "Documents" && <DocumentsTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Visibility" && <VisibilityTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Analytics" && <AnalyticsTab analytics={analytics} />}
      </div>
    </div>
  );
}
