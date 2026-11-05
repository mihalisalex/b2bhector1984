"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { SORT_OPTIONS } from "@/lib/catalogSort";
import { TextAction } from "@/components/ui/TextAction";
import { cn } from "@/lib/cn";
import { useI18n } from "@/i18n/I18nProvider";
import {
  categoryLabel,
  sortLabel,
} from "@/lib/data/styleLabels";
import type { Category } from "@/lib/types";


/** Standalone search box, meant to sit next to the page title. Syncs the `q` param same as before. */
export function CatalogSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const c = useI18n().dict.catalog;
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cancel a still-pending debounce on unmount — otherwise navigating away mid-typing
  // fires a router.push from a component that no longer exists.
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local input state from an external source (the URL), not derived from React state
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
  }

  return (
    <input
      type="search"
      value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)}
      placeholder={c.searchPlaceholder}
      aria-label={c.searchStyles}
      className="w-full border-b border-stone-300 bg-transparent py-1.5 text-sm outline-none transition-colors duration-300 placeholder:text-ink-soft focus-visible:border-ink sm:w-44"
    />
  );
}

/** "Filters" button that opens a dropdown panel anchored to its own top-right corner. */
export function CatalogFiltersPanel({
  colorOptions = [],
}: {
  /** Real colourway names from the catalogue (`colorOptionsFromStyles`). Empty hides the group entirely — never invent options here, that was the bug. */
  colorOptions?: string[];
}) {
  const router = useRouter();
  const { dict } = useI18n();
  const c = dict.catalog;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

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

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["gender", "availability", "color", "price", "box", "flag"].forEach((key) => params.delete(key));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isChecked = (key: string, value: string) => searchParams.getAll(key).includes(value);
  const activeCount =
    searchParams.getAll("gender").length +
    searchParams.getAll("availability").length +
    searchParams.getAll("color").length +
    searchParams.getAll("price").length +
    searchParams.getAll("box").length +
    searchParams.getAll("flag").length;

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 py-1.5 text-sm transition-colors duration-300 hover:text-ink",
          open || activeCount > 0 ? "text-ink" : "text-ink-soft",
        )}
      >
        {c.filters} {activeCount > 0 && `(${activeCount})`}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 flex max-h-[70vh] w-72 flex-col gap-5 overflow-y-auto border border-stone-300 bg-white p-4 text-left shadow-lg">



          {colorOptions.length > 0 && (
            <FilterGroup title={c.grpColorway}>
              {colorOptions.map((name) => (
                <Checkbox key={name} label={name} checked={isChecked("color", name)} onChange={() => toggle("color", name)} />
              ))}
            </FilterGroup>
          )}


          {activeCount > 0 && (
            <TextAction tone="accent" onClick={clearAll} className="text-left">
              {c.clearAllFilters}
            </TextAction>
          )}
        </div>
      )}
    </div>
  );
}

/** Result count + sort + grid/list toggle row, shown above the results. */
export function CatalogResultsToolbar({
  showPricing = true,
}: {
  /** False for visitors who aren't signed in — sorting by a price they can't see is noise. */
  showPricing?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const sort = searchParams.get("sort") ?? "newest";

  return (
    <SortSelect value={sort} onChange={(v) => setParam("sort", v)} showPricing={showPricing} />
  );
}

function SortSelect({
  value,
  onChange,
  showPricing,
}: {
  value: string;
  onChange: (v: string) => void;
  showPricing: boolean;
}) {
  const { dict } = useI18n();
  const c = dict.catalog;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={c.sortBy}
      className="max-w-40 bg-transparent py-1.5 text-sm text-ink-soft outline-none transition-colors duration-300 hover:text-ink"
    >
      {SORT_OPTIONS.filter((o) => showPricing || !o.value.startsWith("price_")).map((o) => (
        <option key={o.value} value={o.value}>{`${c.sortPrefix}: ${sortLabel(dict, o.value)}`}</option>
      ))}
    </select>
  );
}

/**
 * The catalogue's chapters as plain words: every category, with how many styles it holds.
 * Selecting one replaces any other, because it answers "show me the boots", not a query.
 */
export function CatalogCategoryNav({ categories, total }: { categories: { value: Category; count: number }[]; total: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { dict } = useI18n();
  const active = searchParams.getAll("category");
  const href = (value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    if (value) params.set("category", value);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const item = (label: string, count: number, value: string | undefined, on: boolean) => (
    <Link
      key={label}
      href={href(value)}
      scroll={false}
      aria-current={on ? "true" : undefined}
      className={cn(
        "shrink-0 whitespace-nowrap border-b py-1.5 text-sm transition-colors duration-300",
        on ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink",
      )}
    >
      {label} <span className="text-xs tabular-nums text-ink-soft">{count}</span>
    </Link>
  );
  return (
    <div className="flex items-center gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={dict.catalog.quickCategoryFilter}>
      {item(dict.catalog.allStyles, total, undefined, active.length === 0)}
      {categories.map((c) => item(categoryLabel(dict, c.value), c.count, c.value, active.includes(c.value)))}
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
      <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-ink" />
      {label}
    </label>
  );
}

/**
 * The first choice a shop owner makes: which season they are buying for. Large words at the top
 * of the page, as links, so each season has its own shareable address. A style sold in both
 * seasons counts in both. Changing season clears the category, which may not exist in the other.
 */
export function CatalogSeasonSwitch({ seasons, total }: { seasons: { value: string; count: number }[]; total: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const c = useI18n().dict.catalog;
  const active = searchParams.get("season");
  const href = (value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("season");
    params.delete("category");
    if (value) params.set("season", value);
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };
  const item = (label: string, count: number, value: string | undefined) => {
    const on = value ? active === value : !active;
    return (
      <Link
        key={label}
        href={href(value)}
        scroll={false}
        aria-current={on ? "true" : undefined}
        className={cn("transition-colors duration-300", on ? "text-ink" : "text-ink-soft hover:text-ink")}
      >
        <span className="font-display text-xl lg:text-4xl">{label}</span>{" "}
        <span className="text-xs tabular-nums text-ink-soft">{count}</span>
      </Link>
    );
  };
  return (
    <nav className="mt-10 flex flex-wrap items-baseline gap-x-4 gap-y-2 sm:gap-x-8 lg:gap-x-12">
      {item(c.allStyles, total, undefined)}
      {seasons.map((s) => item(s.value === "winter" ? c.seasonNavWinter : c.seasonNavSummer, s.count, s.value))}
    </nav>
  );
}
