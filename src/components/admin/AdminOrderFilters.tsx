"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { OrderStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Όλες οι καταστάσεις" },
  { value: "submitted", label: "Νέο αίτημα" },
  { value: "confirmed", label: "Επιβεβαιωμένη" },
  { value: "in_production", label: "Σε παραγωγή" },
  { value: "shipped", label: "Στη μεταφορική" },
  { value: "delivered", label: "Παραδόθηκε" },
  { value: "cancelled", label: "Ακυρώθηκε" },
];

export function AdminOrderFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={(e) => setParam("q", e.target.value)}
        placeholder="Αναζήτηση με αριθμό ή πελάτη"
        className="w-full max-w-xs border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
      />
      <select
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => setParam("status", e.target.value)}
        className="border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
