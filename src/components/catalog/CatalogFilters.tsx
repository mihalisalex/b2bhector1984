"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { COLOR_FAMILIES, PRICE_BANDS } from "@/lib/catalogFilters";
import { cn } from "@/lib/cn";

const SEASON_OPTIONS = [
  { value: "summer", label: "Summer" },
  { value: "winter", label: "Winter" },
];

const CATEGORY_OPTIONS = [
  { value: "loafers", label: "Loafers" },
  { value: "wedding", label: "Wedding" },
  { value: "sneakers", label: "Sneakers" },
  { value: "sandals", label: "Sandals" },
  { value: "boots", label: "Boots" },
  { value: "formal", label: "Formal" },
  { value: "anatomic", label: "Anatomic" },
];

const GENDER_OPTIONS = [
  { value: "mens", label: "Men's" },
  { value: "womens", label: "Women's" },
  { value: "unisex", label: "Unisex" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available now" },
  { value: "prebook", label: "Pre-book" },
];

export function CatalogFilters({ resultCount }: { resultCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const existing = params.getAll(key);
      params.delete(key);
      if (existing.includes(value)) {
        existing.filter((v) => v !== value).forEach((v) => params.append(key, v));
      } else {
        [...existing, value].forEach((v) => params.append(key, v));
      }
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setQuery = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearAll = () => router.push(pathname, { scroll: false });

  const isChecked = (key: string, value: string) => searchParams.getAll(key).includes(value);
  const activeCount = Array.from(searchParams.keys()).filter((k) => k !== "q").length
    ? searchParams.getAll("category").length +
      searchParams.getAll("season").length +
      searchParams.getAll("gender").length +
      searchParams.getAll("availability").length +
      searchParams.getAll("color").length +
      searchParams.getAll("price").length
    : 0;

  return (
    <div className="lg:w-64 lg:shrink-0">
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-wide"
        >
          Filters {activeCount > 0 && `(${activeCount})`}
        </button>
        <span className="font-mono-tab text-xs text-ink-soft">{resultCount} styles</span>
      </div>

      <div className={cn("mt-4 flex-col gap-6 lg:mt-0 lg:flex", open ? "flex" : "hidden")}>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Search</label>
          <input
            type="search"
            defaultValue={searchParams.get("q") ?? ""}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Style name or number"
            className="mt-1.5 w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
          />
        </div>

        <FilterGroup title="Season">
          {SEASON_OPTIONS.map((opt) => (
            <Checkbox key={opt.value} label={opt.label} checked={isChecked("season", opt.value)} onChange={() => toggle("season", opt.value)} />
          ))}
        </FilterGroup>

        <FilterGroup title="Category">
          {CATEGORY_OPTIONS.map((opt) => (
            <Checkbox key={opt.value} label={opt.label} checked={isChecked("category", opt.value)} onChange={() => toggle("category", opt.value)} />
          ))}
        </FilterGroup>

        <FilterGroup title="Gender">
          {GENDER_OPTIONS.map((opt) => (
            <Checkbox key={opt.value} label={opt.label} checked={isChecked("gender", opt.value)} onChange={() => toggle("gender", opt.value)} />
          ))}
        </FilterGroup>

        <FilterGroup title="Delivery window">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <Checkbox key={opt.value} label={opt.label} checked={isChecked("availability", opt.value)} onChange={() => toggle("availability", opt.value)} />
          ))}
        </FilterGroup>

        <FilterGroup title="Colorway">
          {COLOR_FAMILIES.map((fam) => (
            <Checkbox key={fam} label={fam} checked={isChecked("color", fam)} onChange={() => toggle("color", fam)} />
          ))}
        </FilterGroup>

        <FilterGroup title="Wholesale price">
          {PRICE_BANDS.map((band) => (
            <Checkbox key={band.id} label={band.label} checked={isChecked("price", band.id)} onChange={() => toggle("price", band.id)} />
          ))}
        </FilterGroup>

        {activeCount > 0 && (
          <button type="button" onClick={clearAll} className="text-left text-xs font-medium uppercase tracking-wide text-signal hover:underline">
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-stone-200 pt-4 first:border-t-0 first:pt-0">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
      <div className="mt-2.5 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft hover:text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-ink"
      />
      {label}
    </label>
  );
}
