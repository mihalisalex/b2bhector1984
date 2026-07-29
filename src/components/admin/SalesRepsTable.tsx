"use client";

import { useState } from "react";
import { SalesRepRow } from "@/components/admin/SalesRepRow";
import { ListPager } from "@/components/admin/ListPager";
import type { AdminSalesRep } from "@/lib/data/salesReps";

const PAGE_SIZE = 20;

export function SalesRepsTable({ reps }: { reps: AdminSalesRep[] }) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(reps.length / PAGE_SIZE));
  const page_ = Math.min(page, pageCount);
  const pageRows = reps.slice((page_ - 1) * PAGE_SIZE, page_ * PAGE_SIZE);

  return (
    <div>
      <div className="scroll-thin mt-6 overflow-x-auto border border-stone-300 bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="px-3 py-2.5 font-semibold">Details</th>
              <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((rep) => (
              <SalesRepRow key={rep.id} rep={rep} />
            ))}
          </tbody>
        </table>
      </div>
      <ListPager page={page_} pageCount={pageCount} total={reps.length} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
