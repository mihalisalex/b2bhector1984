"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Brand, Supplier } from "@/lib/types";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
  { value: "out_of_stock", label: "Out of stock" },
];

const INVENTORY_OPTIONS = [
  { value: "all", label: "All inventory" },
  { value: "in_stock", label: "In stock" },
  { value: "low_stock", label: "Low stock" },
  { value: "out_of_stock", label: "Out of stock" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "best_selling", label: "Best selling" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "stock_asc", label: "Stock: low to high" },
  { value: "stock_desc", label: "Stock: high to low" },
  { value: "alphabetical", label: "Alphabetical" },
];

export function ProductFilterBar({
  categories,
  brands,
  suppliers,
  view,
}: {
  categories: { value: string; label: string }[];
  brands: Brand[];
  suppliers: Supplier[];
  view: "table" | "grid";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cancel a still-pending debounce on unmount — otherwise navigating away mid-typing
  // fires a router.push from a component that no longer exists.
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Debounced so every keystroke doesn't trigger a full product-list refetch —
  // matches the same pattern already used on the buyer-facing catalogue filters.
  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 300);
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search name, SKU, or style number"
          className="w-full max-w-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          aria-label="Search products"
        />
        <select
          defaultValue={searchParams.get("status") ?? "all"}
          onChange={(e) => setParam("status", e.target.value)}
          className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get("category") ?? ""}
          onChange={(e) => setParam("category", e.target.value)}
          className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select
          defaultValue={searchParams.get("brand") ?? ""}
          onChange={(e) => setParam("brand", e.target.value)}
          className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          aria-label="Filter by brand"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        {suppliers.length > 0 && (
          <select
            defaultValue={searchParams.get("supplier") ?? ""}
            onChange={(e) => setParam("supplier", e.target.value)}
            className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
            aria-label="Filter by supplier"
          >
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        )}
        <select
          defaultValue={searchParams.get("inventory") ?? "all"}
          onChange={(e) => setParam("inventory", e.target.value)}
          className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          aria-label="Filter by inventory level"
        >
          {INVENTORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          defaultValue={searchParams.get("sort") ?? "newest"}
          onChange={(e) => setParam("sort", e.target.value)}
          className="border border-stone-300 bg-white px-3 py-2 text-xs uppercase tracking-wide outline-none focus-visible:border-signal"
          aria-label="Sort by"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <div className="flex items-center border border-stone-300 text-xs font-semibold uppercase tracking-wide">
          <button
            type="button"
            onClick={() => setParam("view", "table")}
            className={`px-3 py-2 ${view === "table" ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink"}`}
            aria-pressed={view === "table"}
          >
            Table
          </button>
          <button
            type="button"
            onClick={() => setParam("view", "grid")}
            className={`border-l border-stone-300 px-3 py-2 ${view === "grid" ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink"}`}
            aria-pressed={view === "grid"}
          >
            Grid
          </button>
        </div>
      </div>
    </div>
  );
}
