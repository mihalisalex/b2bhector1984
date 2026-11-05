"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TABS, type Tab } from "@/components/admin/products/editor/tabs";
import { useToastResult } from "@/components/ui/ToastProvider";
import { archiveProductAction, deleteProductAction } from "@/lib/productActions";
import { ProductEssentials } from "@/components/admin/products/editor/ProductEssentials";
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


const STATUS_LABEL: Record<string, string> = { active: "Ενεργό", draft: "Πρόχειρο", archived: "Αρχειοθετημένο", private: "Ιδιωτικό" };

/** Advanced sections, Greek labels over the stable `?tab=` values the SEO pages link to. */
const TAB_LABEL: Record<Tab, string> = {
  General: "Μάρκα, ετικέτες, ημερομηνία",
  Pricing: "Κόστος, ΦΠΑ, έναρξη έκπτωσης",
  Inventory: "Απόθεμα",
  "Images & Media": "Φωτογραφίες",
  Variants: "Χρώματα",
  Attributes: "Ιδιότητες",
  Shipping: "Βάρος, διαστάσεις",
  SEO: "SEO",
  Related: "Σχετικά προϊόντα",
  Documents: "Έγγραφα",
  Visibility: "Ιδιωτικό, προγραμματισμός",
  Analytics: "Στατιστικά",
};
const ADVANCED_TABS = TABS.filter((t) => t !== "Images & Media");

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
  slugHistory,
  commerceIndexable,
  initialTab,
  isNewColour = false,
}: {
  isNewColour?: boolean;
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
  slugHistory: { slug: string; isCurrent: boolean; createdAt: string }[];
  /** Global indexing policy — the SEO tab needs it to explain why a product is noindex. */
  commerceIndexable: boolean;
  /** Lets the SEO dashboard deep-link straight to a product's SEO tab. */
  initialTab?: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab && initialTab !== "Images & Media" ? initialTab : "General");
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(initialTab && initialTab !== "Images & Media"));
  const [essentialSaves, setEssentialSaves] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const showResult = useToastResult();
  const router = useRouter();

  function handleArchive() {
    startTransition(async () => {
      await archiveProductAction(style.id);
      showResult({ success: "Αρχειοθετήθηκε." });
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
          <Link href="/admin/products" className="hover:text-ink">Προϊόντα</Link> / {style.name}
        </nav>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-ink">{style.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              {style.styleNumber} · {STATUS_LABEL[style.status]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/product/${style.slug}`}
              target="_blank"
              className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink"
            >
              Προβολή στο site
            </Link>
            {permissions["products.delete"] && (
              <button
                type="button"
                onClick={handleArchive}
                disabled={isPending || style.status === "archived"}
                className="border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:border-ink disabled:opacity-40"
              >
                Αρχειοθέτηση
              </button>
            )}
            {permissions["products.delete"] &&
              (confirmingDelete ? (
                <span className="flex items-center gap-2 border border-ember bg-ember-100 px-2 py-1 text-xs text-ember">
                  Οριστική διαγραφή;
                  <button type="button" onClick={handleDelete} disabled={isPending} className="font-semibold underline">
                    Ναι
                  </button>
                  <button type="button" onClick={() => setConfirmingDelete(false)} className="underline">
                    Άκυρο
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="border border-ember px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ember hover:bg-ember-100"
                >
                  Διαγραφή
                </button>
              ))}
          </div>
        </div>

      </div>

      {isNewColour && (
        <p className="mt-6 border border-ink bg-stone-100 px-4 py-3 text-sm text-ink">
          <strong>Νέο χρώμα.</strong> Αντιγράφηκαν τα κείμενα και οι τιμές. Άλλαξε όνομα, κωδικό και χρώμα, ανέβασε τη
          φωτογραφία και βάλε το σε «Ενεργό» όταν είναι έτοιμο.
        </p>
      )}

      <section className="pt-6">
        <h2 className="font-display text-2xl text-ink">Φωτογραφίες</h2>
        <div className="mt-4">
          <MediaTab style={style} images={images} canEdit={permissions["products.edit"]} />
        </div>
      </section>

      {/* Both forms use default values and can edit the same fields, so each must start again from
          the saved product when the other saves, or its next save would undo that change. */}
      <ProductEssentials
        key={JSON.stringify(style)}
        style={style}
        canEdit={permissions["products.edit"]}
        canPrice={permissions["products.pricing"]}
        onSaved={() => setEssentialSaves((n) => n + 1)}
      />

      <details open={advancedOpen} onToggle={(e) => setAdvancedOpen(e.currentTarget.open)} className="mt-12 border-t border-stone-300 pt-6">
        <summary className="cursor-pointer font-display text-2xl text-ink">Για προχωρημένους</summary>
        <p className="mt-1 text-sm text-ink-soft">Σπάνια χρειάζονται. Κάθε ενότητα εδώ έχει δικό της κουμπί αποθήκευσης.</p>
        <div role="tablist" className="scroll-thin mt-4 flex gap-1 overflow-x-auto border-b border-stone-300">
          {ADVANCED_TABS.map((t) => (
            <button
              key={t}
              type="button"
              id={`tab-${t}`}
              role="tab"
              aria-selected={tab === t}
              aria-controls="product-editor-tabpanel"
              onClick={() => {
                setTab(t);
                // In the URL so a section can be linked to (the SEO pages do) and survives a reload.
                router.replace(`?tab=${encodeURIComponent(t.toLowerCase())}`, { scroll: false });
              }}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors ${
                tab === t ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
              }`}
            >
              {TAB_LABEL[t]}
            </button>
          ))}
        </div>
      <div key={essentialSaves} id="product-editor-tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-6">
        {tab === "General" && (
          <GeneralTab style={style} brands={brands} suppliers={suppliers} collections={collections} canEdit={permissions["products.edit"]} />
        )}
        {tab === "Pricing" && <PricingTab style={style} canEdit={permissions["products.pricing"]} />}
        {tab === "Inventory" && (
          <InventoryTab style={style} warehouses={warehouses} warehouseStock={warehouseStock} movements={movements} canEdit={permissions["products.inventory"]} />
        )}
                {tab === "Variants" && <VariantsTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Attributes" && <AttributesTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Shipping" && <ShippingTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "SEO" && (
          <SeoTab
            style={style}
            images={images}
            slugHistory={slugHistory}
            commerceIndexable={commerceIndexable}
            canEdit={permissions["products.seo"]}
          />
        )}
        {tab === "Related" && <RelatedTab style={style} allStyles={allStyles} canEdit={permissions["products.edit"]} />}
        {tab === "Documents" && <DocumentsTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Visibility" && <VisibilityTab style={style} canEdit={permissions["products.edit"]} />}
        {tab === "Analytics" && <AnalyticsTab analytics={analytics} />}
      </div>
      </details>
    </div>
  );
}
