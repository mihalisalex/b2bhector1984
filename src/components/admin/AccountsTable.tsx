"use client";

import { useMemo, useState } from "react";
import { PriceMultiplierInput } from "@/components/admin/PriceMultiplierInput";
import { CreditTermsSelect } from "@/components/admin/CreditTermsSelect";
import { CreditLimitInput } from "@/components/admin/CreditLimitInput";
import { MinOrderPairsInput } from "@/components/admin/MinOrderPairsInput";
import { RepSelect } from "@/components/admin/RepSelect";
import { PhoneInput } from "@/components/admin/PhoneInput";
import { ListPager } from "@/components/admin/ListPager";
import type { Account } from "@/lib/types";
import type { AdminSalesRep } from "@/lib/data/salesReps";

const PAGE_SIZE = 20;

export function AccountsTable({ accounts, reps }: { accounts: Account[]; reps: AdminSalesRep[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.businessName.toLowerCase().includes(q) ||
        a.contactName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q),
    );
  }, [accounts, query]);

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
        placeholder="Search business, contact, or email…"
        aria-label="Search accounts"
        className="mt-4 w-full max-w-sm border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal"
      />

      {filtered.length === 0 ? (
        <div className="mt-6 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No accounts match &ldquo;{query}&rdquo;.
        </div>
      ) : (
        <>
          <div className="scroll-thin mt-4 overflow-x-auto border border-stone-300 bg-white">
            <table className="w-full min-w-[880px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-2.5 font-semibold">Business</th>
                  <th className="px-4 py-2.5 font-semibold">WhatsApp phone</th>
                  <th className="px-4 py-2.5 font-semibold">Terms</th>
                  <th className="px-4 py-2.5 font-semibold">Credit limit</th>
                  <th className="px-4 py-2.5 font-semibold">Rep</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Price multiplier</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Min order</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((account) => (
                  <tr key={account.id} className="border-b border-stone-200 last:border-b-0">
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-ink">{account.businessName}</p>
                      <p className="text-xs text-ink-soft">{account.contactName} · {account.email}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <PhoneInput accountId={account.id} phone={account.phone} businessName={account.businessName} />
                    </td>
                    <td className="px-4 py-2.5">
                      <CreditTermsSelect accountId={account.id} creditTerms={account.creditTerms} businessName={account.businessName} />
                    </td>
                    <td className="px-4 py-2.5">
                      <CreditLimitInput accountId={account.id} creditLimit={account.creditLimit} businessName={account.businessName} />
                    </td>
                    <td className="px-4 py-2.5">
                      <RepSelect accountId={account.id} repId={account.repId} reps={reps} businessName={account.businessName} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <PriceMultiplierInput accountId={account.id} priceMultiplier={account.priceMultiplier} businessName={account.businessName} />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <MinOrderPairsInput accountId={account.id} minOrderPairs={account.minOrderPairs} businessName={account.businessName} />
                    </td>
                  </tr>
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
