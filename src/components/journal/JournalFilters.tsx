"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { JOURNAL_CATEGORIES } from "@/lib/types";

export function JournalFilters({ categoryCounts }: { categoryCounts: Record<string, number> }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Cancel a still-pending debounce on unmount — otherwise navigating away mid-typing
  // fires a router.push from a component that no longer exists.
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing local input state from an external source (the URL), not derived from React state
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 300);
  }

  const activeCategory = searchParams.get("category") ?? "";

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        value={searchValue}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search articles"
        aria-label="Search articles"
        className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal sm:max-w-sm"
      />

      <div className="scroll-thin -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-0.5 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Category">
        <button
          type="button"
          onClick={() => setParam("category", "")}
          aria-pressed={!activeCategory}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors",
            !activeCategory ? "border-ink bg-ink text-white" : "border-stone-300 bg-white text-ink-soft hover:border-ink",
          )}
        >
          All ({Object.values(categoryCounts).reduce((sum, n) => sum + n, 0)})
        </button>
        {JOURNAL_CATEGORIES.filter((c) => categoryCounts[c] > 0).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setParam("category", activeCategory === c ? "" : c)}
            aria-pressed={activeCategory === c}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors",
              activeCategory === c ? "border-ink bg-ink text-white" : "border-stone-300 bg-white text-ink-soft hover:border-ink",
            )}
          >
            {c} ({categoryCounts[c]})
          </button>
        ))}
      </div>
    </div>
  );
}
