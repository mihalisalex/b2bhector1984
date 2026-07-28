import { getAllAccounts } from "@/lib/data/accounts";
import { getAllSalesReps } from "@/lib/data/salesReps";
import { PriceMultiplierInput } from "@/components/admin/PriceMultiplierInput";
import { CreditTermsSelect } from "@/components/admin/CreditTermsSelect";
import { CreditLimitInput } from "@/components/admin/CreditLimitInput";
import { RepSelect } from "@/components/admin/RepSelect";

export const metadata = { title: "Accounts", robots: { index: false, follow: false } };

export default async function AdminAccountsPage() {
  const [accounts, reps] = await Promise.all([getAllAccounts(), getAllSalesReps()]);

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Accounts
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Every field below saves immediately on change — terms, credit limit, rep assignment, and the
        negotiated-pricing multiplier (applies on top of each order&rsquo;s payment-terms discount).
      </p>

      {accounts.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No active buyer accounts yet.
        </div>
      ) : (
        <div className="scroll-thin mt-6 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[880px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-semibold">Business</th>
                <th className="px-4 py-2.5 font-semibold">Terms</th>
                <th className="px-4 py-2.5 font-semibold">Credit limit</th>
                <th className="px-4 py-2.5 font-semibold">Rep</th>
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
                  <td className="px-4 py-2.5">
                    <CreditTermsSelect
                      accountId={account.id}
                      creditTerms={account.creditTerms}
                      businessName={account.businessName}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <CreditLimitInput
                      accountId={account.id}
                      creditLimit={account.creditLimit}
                      businessName={account.businessName}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <RepSelect
                      accountId={account.id}
                      repId={account.repId}
                      reps={reps}
                      businessName={account.businessName}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <PriceMultiplierInput
                      accountId={account.id}
                      priceMultiplier={account.priceMultiplier}
                      businessName={account.businessName}
                    />
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
