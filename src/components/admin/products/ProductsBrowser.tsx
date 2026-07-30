"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatEUR } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { toCsv } from "@/lib/csv";
import { StylePlate } from "@/components/product/StylePlate";
import { useToastResult } from "@/components/ui/ToastProvider";
import {
  archiveProductAction,
  deleteProductAction,
  duplicateProductAction,
  bulkAdjustPriceAction,
  bulkArchiveAction,
  bulkDeleteAction,
  bulkAddTagAction,
  bulkSetBrandAction,
  bulkSetSupplierAction,
  bulkUpdateStatusAction,
} from "@/lib/productActions";
import type { ProductRow } from "@/lib/data/productAdmin";
import type { Brand, ProductStatus, Supplier } from "@/lib/types";

const STATUS_LABEL: Record<ProductStatus | "out_of_stock", string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
  private: "Private",
  out_of_stock: "Out of stock",
};

const STATUS_CLASS: Record<ProductStatus | "out_of_stock", string> = {
  active: "bg-positive-100 text-positive",
  draft: "bg-stone-200 text-ink-soft",
  archived: "bg-court-100 text-court",
  private: "bg-stone-200 text-ink-soft",
  out_of_stock: "bg-ember-100 text-ember",
};

type BulkMode = "status" | "archive" | "delete" | "price" | "brand" | "supplier" | "tag";

export function ProductsBrowser({
  items,
  view,
  brands,
  suppliers,
}: {
  items: ProductRow[];
  view: "table" | "grid";
  brands: Brand[];
  suppliers: Supplier[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState<BulkMode>("status");
  const [bulkStatus, setBulkStatus] = useState<ProductStatus>("active");
  const [bulkPriceMode, setBulkPriceMode] = useState<"set" | "increase_pct" | "decrease_pct">("increase_pct");
  const [bulkPriceValue, setBulkPriceValue] = useState("10");
  const [bulkBrand, setBulkBrand] = useState(brands[0]?.id ?? "");
  const [bulkSupplier, setBulkSupplier] = useState(suppliers[0]?.id ?? "");
  const [bulkTag, setBulkTag] = useState("");
  const [isPending, startTransition] = useTransition();
  const showResult = useToastResult();
  const router = useRouter();

  // Drop any selected id no longer in the current (filtered/paginated) list —
  // otherwise a bulk action after changing filters/pages can silently act on
  // off-screen rows the admin can no longer see.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing selection to the current external item list, not derived render state
    setSelected((prev) => {
      const visibleIds = new Set(items.map((i) => i.id));
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [items]);

  const allSelected = items.length > 0 && items.every((i) => selected.has(i.id));

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function applyBulk() {
    const ids = Array.from(selected);
    if (bulkMode === "delete" && !confirm(
      `Permanently delete ${ids.length} product${ids.length === 1 ? "" : "s"}? This can't be undone — their photos, ` +
      `documents, and variant data go with them. Past orders keep their line items but will show the product as deleted.`,
    )) return;
    startTransition(async () => {
      let result;
      switch (bulkMode) {
        case "status":
          result = await bulkUpdateStatusAction(ids, bulkStatus);
          break;
        case "archive":
          result = await bulkArchiveAction(ids);
          break;
        case "delete":
          result = await bulkDeleteAction(ids);
          break;
        case "price":
          result = await bulkAdjustPriceAction(ids, bulkPriceMode, Number(bulkPriceValue) || 0);
          break;
        case "brand":
          result = await bulkSetBrandAction(ids, bulkBrand);
          break;
        case "supplier":
          result = await bulkSetSupplierAction(ids, bulkSupplier);
          break;
        case "tag":
          result = await bulkAddTagAction(ids, bulkTag);
          break;
      }
      showResult(result);
      if (!result?.error) setSelected(new Set());
    });
  }

  function exportCsv() {
    const header = [
      "SKU", "Name", "Category", "Brand", "Supplier", "Price", "Sale Price", "Cost Price", "Margin %",
      "Stock", "Reserved", "Status", "Featured", "Created", "Updated",
    ];
    const rows = items.map((p) => [
      p.styleNumber, p.name, p.category, p.brandName, p.supplierName ?? "", p.basePrice, p.salePrice ?? "", p.costPrice,
      p.marginPct, p.onHand, p.reserved, p.derivedStatus, p.featured ? "Yes" : "No", formatDate(p.createdAt), formatDate(p.createdAt),
    ]);
    const csv = toCsv([header, ...rows]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hector-1984-products.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          {selected.size > 0 ? `${selected.size} selected` : `${items.length} shown`}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="border border-ink px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink hover:bg-ink hover:text-white"
        >
          Export CSV
        </button>
      </div>

      {selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-3 border border-stone-300 bg-stone-100 px-4 py-3 shadow-sm">
          <select
            value={bulkMode}
            onChange={(e) => setBulkMode(e.target.value as BulkMode)}
            className="border border-stone-300 bg-white px-2 py-1.5 text-xs outline-none focus-visible:border-signal"
            aria-label="Bulk action"
          >
            <option value="status">Set status</option>
            <option value="archive">Archive</option>
            <option value="delete">Delete</option>
            <option value="price">Adjust price</option>
            <option value="brand">Set brand</option>
            <option value="supplier">Set supplier</option>
            <option value="tag">Add tag</option>
          </select>

          {bulkMode === "status" && (
            <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value as ProductStatus)} className="border border-stone-300 bg-white px-2 py-1.5 text-xs">
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="private">Private</option>
            </select>
          )}
          {bulkMode === "price" && (
            <>
              <select value={bulkPriceMode} onChange={(e) => setBulkPriceMode(e.target.value as typeof bulkPriceMode)} className="border border-stone-300 bg-white px-2 py-1.5 text-xs">
                <option value="increase_pct">Increase by %</option>
                <option value="decrease_pct">Decrease by %</option>
                <option value="set">Set to exact price</option>
              </select>
              <input
                type="number"
                value={bulkPriceValue}
                onChange={(e) => setBulkPriceValue(e.target.value)}
                className="w-24 border border-stone-300 bg-white px-2 py-1.5 text-xs"
                aria-label="Bulk price value"
              />
            </>
          )}
          {bulkMode === "brand" && (
            <select value={bulkBrand} onChange={(e) => setBulkBrand(e.target.value)} className="border border-stone-300 bg-white px-2 py-1.5 text-xs">
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          )}
          {bulkMode === "supplier" && (
            <select value={bulkSupplier} onChange={(e) => setBulkSupplier(e.target.value)} className="border border-stone-300 bg-white px-2 py-1.5 text-xs">
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
          {bulkMode === "tag" && (
            <input
              type="text"
              value={bulkTag}
              onChange={(e) => setBulkTag(e.target.value)}
              placeholder="tag name"
              className="w-32 border border-stone-300 bg-white px-2 py-1.5 text-xs"
            />
          )}

          <button
            type="button"
            onClick={applyBulk}
            disabled={isPending}
            className={`px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50 ${
              bulkMode === "delete" ? "bg-ember hover:bg-ember/85" : "bg-ink hover:bg-ink/85"
            }`}
          >
            {isPending ? "Applying…" : bulkMode === "delete" ? `Delete ${selected.size}` : `Apply to ${selected.size}`}
          </button>
        </div>
      )}

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <div key={p.id} className="group relative border border-stone-300 bg-white">
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggleOne(p.id)}
                aria-label={`Select ${p.name}`}
                className="absolute left-2 top-2 z-10 h-4 w-4 accent-ink"
              />
              <Link href={`/admin/products/${p.id}`}>
                <StylePlate swatch={p.colorways[0]?.swatch ?? ["#121212"]} imageUrl={p.primaryImageUrl} alt={p.name} className="aspect-[4/3] w-full" dense />
              </Link>
              <div className="p-3">
                <div className="flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[p.derivedStatus]}`}>
                    {STATUS_LABEL[p.derivedStatus]}
                  </span>
                  {p.featured && <span className="bg-signal px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Featured</span>}
                </div>
                <Link href={`/admin/products/${p.id}`} className="mt-1.5 block text-sm font-semibold text-ink hover:underline">
                  {p.name}
                </Link>
                <p className="font-mono-tab text-[11px] text-ink-soft">{p.styleNumber}</p>
                <div className="mt-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold tabular-nums text-ink">{formatEUR(p.salePrice ?? p.basePrice)}</span>
                  <span className="text-ink-soft">{p.onHand} on hand</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="scroll-thin overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[1200px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-3 py-2.5">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all products" />
                </th>
                <th className="px-3 py-2.5">Product</th>
                <th className="px-3 py-2.5">SKU</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Brand</th>
                <th className="px-3 py-2.5 text-right">Price</th>
                <th className="px-3 py-2.5 text-right">Sale</th>
                <th className="px-3 py-2.5 text-right">Cost</th>
                <th className="px-3 py-2.5 text-right">Margin</th>
                <th className="px-3 py-2.5 text-right">Stock</th>
                <th className="px-3 py-2.5 text-right">Reserved</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Created</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-stone-200 last:border-b-0 hover:bg-stone-50">
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link href={`/admin/products/${p.id}`} className="flex items-center gap-2.5">
                      <span className="relative block h-10 w-10 shrink-0 overflow-hidden bg-stone-200">
                        {p.primaryImageUrl ? (
                          <Image src={p.primaryImageUrl} alt="" fill sizes="40px" className="object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-[9px] text-ink-soft">—</span>
                        )}
                      </span>
                      <span className="flex flex-col">
                        <span className="font-medium text-ink hover:underline">{p.name}</span>
                        {p.featured && <span className="text-[10px] font-semibold uppercase tracking-wide text-signal">Featured</span>}
                      </span>
                    </Link>
                  </td>
                  <td className="font-mono-tab px-3 py-2.5 text-ink-soft">{p.styleNumber}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{p.category}</td>
                  <td className="px-3 py-2.5 text-ink-soft">{p.brandName}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink">{formatEUR(p.basePrice)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">{p.salePrice ? formatEUR(p.salePrice) : "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">{formatEUR(p.costPrice)}</td>
                  <td className="font-mono-tab px-3 py-2.5 text-right text-ink-soft">{p.marginPct}%</td>
                  <td className="font-mono-tab px-3 py-2.5 text-right text-ink">{p.onHand}</td>
                  <td className="font-mono-tab px-3 py-2.5 text-right text-ink-soft">{p.reserved}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_CLASS[p.derivedStatus]}`}>
                      {STATUS_LABEL[p.derivedStatus]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-ink-soft">{formatDate(p.createdAt)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${p.id}`} className="text-xs font-medium text-ink-soft hover:text-ink">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => startTransition(async () => {
                          const result = await duplicateProductAction(p.id);
                          if (result.error) { showResult({ error: result.error }); return; }
                          router.push(`/admin/products/${result.id}`);
                        })}
                        className="text-xs font-medium text-ink-soft hover:text-ink"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => startTransition(async () => { await archiveProductAction(p.id); showResult({ success: `Archived ${p.name}.` }); })}
                        className="text-xs font-medium text-ink-soft hover:text-ink"
                      >
                        Archive
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!confirm(`Permanently delete "${p.name}"? This can't be undone.`)) return;
                          startTransition(async () => showResult(await deleteProductAction(p.id)));
                        }}
                        className="text-xs font-medium text-ember hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center text-sm text-ink-soft">
                    No products match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
