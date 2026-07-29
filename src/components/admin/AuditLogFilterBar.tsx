"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function AuditLogFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function handleSearchChange(value: string) {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("q", value);
      else params.delete("q");
      params.delete("page");
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }, 300);
  }

  return (
    <input
      type="search"
      value={searchValue}
      onChange={(e) => handleSearchChange(e.target.value)}
      placeholder="Search action, target, or detail…"
      className="mt-4 w-full max-w-sm border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
      aria-label="Search audit log"
    />
  );
}
