import { getAllAccounts } from "@/lib/data/accounts";
import { getAllSalesReps } from "@/lib/data/salesReps";
import { AccountsTable } from "@/components/admin/AccountsTable";

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
        <AccountsTable accounts={accounts} reps={reps} />
      )}
    </div>
  );
}
