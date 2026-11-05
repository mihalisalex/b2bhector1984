"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "all", label: "Όλες οι καταστάσεις" },
  { value: "active", label: "Ενεργά" },
  { value: "draft", label: "Πρόχειρα" },
  { value: "archived", label: "Αρχειοθετημένα" },
];

const SEASON_OPTIONS = [
  { value: "", label: "Όλες οι σεζόν" },
  { value: "winter", label: "Χειμερινά" },
  { value: "summer", label: "Καλοκαιρινά" },
  { value: "both", label: "Και οι δύο σεζόν" },
];

const MISSING_OPTIONS = [
  { value: "", label: "Πλήρη και ελλιπή" },
  { value: "photo", label: "Χωρίς φωτογραφία" },
  { value: "greek", label: "Χωρίς ελληνικά" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Νεότερα" },
  { value: "oldest", label: "Παλαιότερα" },
  { value: "alphabetical", label: "Αλφαβητικά" },
  { value: "price_asc", label: "Τιμή: μικρή προς μεγάλη" },
  { value: "price_desc", label: "Τιμή: μεγάλη προς μικρή" },
  { value: "best_selling", label: "Περισσότερες πωλήσεις" },
];

const SELECT = "border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal";

export function ProductFilterBar({ categories }: { categories: { value: string; label: string }[] }) {
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

  const filter = (label: string, param: string, fallback: string, options: { value: string; label: string }[]) => (
    <select defaultValue={searchParams.get(param) ?? fallback} onChange={(e) => setParam(param, e.target.value)} className={SELECT} aria-label={label}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <input
        type="search"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Αναζήτηση με όνομα ή κωδικό"
        className="w-full max-w-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
        aria-label="Αναζήτηση προϊόντων"
      />
      {filter("Σεζόν", "season", "", SEASON_OPTIONS)}
      {filter("Κατηγορία", "category", "", [{ value: "", label: "Όλες οι κατηγορίες" }, ...categories])}
      {filter("Κατάσταση", "status", "all", STATUS_OPTIONS)}
      {filter("Ελλιπή", "missing", "", MISSING_OPTIONS)}
      {filter("Ταξινόμηση", "sort", "newest", SORT_OPTIONS)}
    </div>
  );
}
