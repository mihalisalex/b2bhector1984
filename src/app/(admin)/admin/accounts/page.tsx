import { getAllAccounts } from "@/lib/data/accounts";
import { TERMS_LABEL, formatEUR } from "@/lib/pricing";
import { PriceMultiplierInput } from "@/components/admin/PriceMultiplierInput";

export const metadata = { title: "Accounts", robots: { index: false, follow: false } };

export default async function AdminAccountsPage() {
  const accounts = await getAllAccounts();

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Accounts
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Negotiated pricing only — the multiplier applies on top of each order&rsquo;s payment-terms
        discount. Editing terms, credit limit, or rep assignment isn&rsquo;t available here yet.
      </p>

      {accounts.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No active buyer accounts yet.
        </div>
      ) : (
        <div className="scroll-thin mt-6 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-semibold">Business</th>
                <th className="px-4 py-2.5 font-semibold">Terms</th>
                <th className="px-4 py-2.5 text-right font-semibold">Credit limit</th>
                <th className="px-4 py-2.5 text-right font-semibold">Price multiplier</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-stone-200 last:border-b-0">
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-ink">{account.businessName}</p>
                    <p className="text-xs text-ink-soft">{account.contactName} · {account.email}</p>
                  </td>
                  <td className="px-4 py-2.5 text-ink-soft">{TERMS_LABEL[account.creditTerms]}</td>
                  <td className="font-mono-tab px-4 py-2.5 text-right text-ink-soft">{formatEUR(account.creditLimit)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <PriceMultiplierInput accountId={account.id} priceMultiplier={account.priceMultiplier} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
