"use client";

import { useMemo, useState } from "react";
import { SupplierRow } from "@/components/admin/products/SupplierRow";
import { ListPager } from "@/components/admin/ListPager";
import type { Supplier } from "@/lib/types";

const PAGE_SIZE = 20;

export function SuppliersTable({ suppliers }: { suppliers: Supplier[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.contactName ?? "").toLowerCase().includes(q) || (s.email ?? "").toLowerCase().includes(q),
    );
  }, [suppliers, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page_ = Math.min(page, pageCount);
  const pageRows = filtered.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setPage(1);
        }}
        placeholder="Search supplier or contact…"
        aria-label="Search suppliers"
        className="mt-4 w-full max-w-sm border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
      />

      {filtered.length === 0 ? (
        <div className="mt-6 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No suppliers match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <>
          <div className="scroll-thin mt-4 overflow-x-auto border border-stone-300 bg-white">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="px-3 py-2.5 font-semibold">Details</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => (
                  <SupplierRow key={s.id} supplier={s} />
                ))}
              </tbody>
            </table>
          </div>
          <ListPager page={page_} pageCount={pageCount} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
        </>
      )}
    </div>
  );
}
