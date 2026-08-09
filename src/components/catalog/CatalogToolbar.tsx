"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { COLOR_FAMILIES, FLAG_OPTIONS, PRICE_BANDS } from "@/lib/catalogFilters";
import { SORT_OPTIONS } from "@/lib/catalogSort";
import { TextAction } from "@/components/ui/TextAction";
import { cn } from "@/lib/cn";

const DEFAULT_SEASON_OPTIONS = [
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

const SEASON_CATEGORIES: Record<string, string[]> = {
  summer: ["loafers", "wedding", "sneakers", "sandals"],
  winter: ["boots", "sneakers", "formal", "anatomic"],
};

const GENDER_OPTIONS = [
  { value: "mens", label: "Men's" },
  { value: "womens", label: "Women's" },
  { value: "unisex", label: "Unisex" },
];

const AVAILABILITY_OPTIONS = [
  { value: "available", label: "Available now" },
  { value: "prebook", label: "Pre-book" },
];

/** Standalone search box, meant to sit next to the page title. Syncs the `q` param same as before. */
export function CatalogSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
      placeholder="Search style name or number"
      aria-label="Search styles"
      className="w-full rounded-full border border-stone-300 bg-white px-4 py-2 text-sm outline-none focus-visible:border-signal sm:w-64"
    />
  );
}

/** "Filters" button that opens a dropdown panel anchored to its own top-right corner. */
export function CatalogFiltersPanel({
  seasonOptions = DEFAULT_SEASON_OPTIONS,
}: {
  /** Enabled seasons with their admin-configured display labels; omit to fall back to the stock Summer/Winter pair. */
  seasonOptions?: { value: string; label: string }[];
}) {
  const router = useRouter();
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

  const toggleSeason = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const existingSeasons = params.getAll("season");
      const nextSeasons = existingSeasons.includes(value)
        ? existingSeasons.filter((v) => v !== value)
        : [...existingSeasons, value];

      // Drop any checked category that isn't offered in the new season selection,
      // so the checkbox list and the active filter never disagree.
      const allowedCategories =
        nextSeasons.length > 0 ? new Set(nextSeasons.flatMap((s) => SEASON_CATEGORIES[s] ?? [])) : null;
      const nextCategories = params.getAll("category").filter((c) => !allowedCategories || allowedCategories.has(c));

      params.delete("season");
      nextSeasons.forEach((v) => params.append("season", v));
      params.delete("category");
      nextCategories.forEach((v) => params.append("category", v));

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    ["category", "season", "gender", "availability", "color", "price", "flag"].forEach((key) => params.delete(key));
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isChecked = (key: string, value: string) => searchParams.getAll(key).includes(value);
  const checkedSeasons = searchParams.getAll("season");
  const visibleCategoryOptions =
    checkedSeasons.length > 0
      ? CATEGORY_OPTIONS.filter((opt) => checkedSeasons.some((s) => SEASON_CATEGORIES[s]?.includes(opt.value)))
      : CATEGORY_OPTIONS;
  const activeCount =
    searchParams.getAll("category").length +
    searchParams.getAll("season").length +
    searchParams.getAll("gender").length +
    searchParams.getAll("availability").length +
    searchParams.getAll("color").length +
    searchParams.getAll("price").length +
    searchParams.getAll("flag").length;

  return (
    <div className="relative shrink-0" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
          activeCount > 0 || open ? "border-ink bg-ink text-white" : "border-ink text-ink hover:bg-ink hover:text-white",
        )}
      >
        Filters {activeCount > 0 && `(${activeCount})`}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-40 mt-2 flex max-h-[70vh] w-72 flex-col gap-5 overflow-y-auto border border-stone-300 bg-white p-4 text-left shadow-lg">
          <FilterGroup title="Show only">
            {FLAG_OPTIONS.map((opt) => (
              <Checkbox
                key={opt.value}
                label={opt.label}
                checked={isChecked("flag", opt.value)}
                onChange={() => toggle("flag", opt.value)}
              />
            ))}
          </FilterGroup>

          {seasonOptions.length > 0 && (
            <FilterGroup title="Season">
              {seasonOptions.map((opt) => (
                <Checkbox key={opt.value} label={opt.label} checked={isChecked("season", opt.value)} onChange={() => toggleSeason(opt.value)} />
              ))}
            </FilterGroup>
          )}

          <FilterGroup title="Category">
            {visibleCategoryOptions.map((opt) => (
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
            <TextAction tone="accent" onClick={clearAll} className="text-left">
              Clear all filters
            </TextAction>
          )}
        </div>
      )}
    </div>
  );
}

/** Result count + sort + grid/list toggle row, shown above the results. */
export function CatalogResultsToolbar({
  resultCount,
  showViewToggle = true,
}: {
  resultCount: number;
  showViewToggle?: boolean;
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

  const view = searchParams.get("view") === "list" ? "list" : "grid";
  const sort = searchParams.get("sort") ?? "newest";

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono-tab text-xs text-ink-soft">{resultCount} styles</span>
      <div className="flex items-center gap-2">
        <SortSelect value={sort} onChange={(v) => setParam("sort", v)} />
        {showViewToggle && <ViewToggle view={view} onChange={(v) => setParam("view", v)} />}
      </div>
    </div>
  );
}

function SortSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="Sort by"
      className="rounded-full border border-stone-300 bg-white px-4 py-2 text-xs uppercase tracking-wide text-ink-soft outline-none focus-visible:border-signal"
    >
      {SORT_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{`Sort: ${o.label}`}</option>
      ))}
    </select>
  );
}

function ViewToggle({ view, onChange }: { view: string; onChange: (v: "grid" | "list") => void }) {
  return (
    <div className="flex items-center overflow-hidden rounded-full border border-stone-300 text-xs font-semibold uppercase tracking-wide">
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={view === "grid"}
        aria-label="Grid view"
        className={cn("px-2.5 py-1.5 transition-colors", view === "grid" ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink")}
      >
        <GridIcon />
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={view === "list"}
        aria-label="List view"
        className={cn(
          "border-l border-stone-300 px-2.5 py-1.5 transition-colors",
          view === "list" ? "bg-ink text-white" : "bg-white text-ink-soft hover:text-ink",
        )}
      >
        <ListIcon />
      </button>
    </div>
  );
}

function GridIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="1" y="1" width="6" height="6" />
      <rect x="9" y="1" width="6" height="6" />
      <rect x="1" y="9" width="6" height="6" />
      <rect x="9" y="9" width="6" height="6" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
      <rect x="1" y="2" width="14" height="3" />
      <rect x="1" y="7" width="14" height="3" />
      <rect x="1" y="12" width="14" height="3" />
    </svg>
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
