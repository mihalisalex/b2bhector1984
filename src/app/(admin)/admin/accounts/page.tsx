import { getAllAccounts } from "@/lib/data/accounts";
import { getAllSalesReps } from "@/lib/data/salesReps";
import { AccountsTable } from "@/components/admin/AccountsTable";
import { countryOptions } from "@/lib/countries";

export const metadata = { title: "Πελάτες", robots: { index: false, follow: false } };

export default async function AdminAccountsPage() {
  const [accounts, reps] = await Promise.all([getAllAccounts(), getAllSalesReps()]);

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Πελάτες
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Κάθε πεδίο αποθηκεύεται αμέσως μόλις αλλάξει. Ο συντελεστής τιμής εφαρμόζεται πάνω από την έκπτωση των όρων πληρωμής.
      </p>

      {accounts.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          Κανένας ενεργός πελάτης ακόμα.
        </div>
      ) : (
        <AccountsTable accounts={accounts} reps={reps} countries={countryOptions("en", "Other")} />
      )}
    </div>
  );
}
