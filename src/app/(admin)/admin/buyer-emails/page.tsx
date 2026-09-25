import { getAllAccounts } from "@/lib/data/accounts";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { SeasonReminderForm } from "@/components/admin/SeasonReminderForm";
import { estimatedArrivalIso } from "@/lib/delivery";

export const metadata = { title: "Buyer emails", robots: { index: false, follow: false } };

/** Seasonal reminder to every buyer: the newest styles and an order-by / delivered-by date. */
export default async function BuyerEmailsPage() {
  const [accounts, styles, hero] = await Promise.all([getAllAccounts(), getStorefrontStyles(), getHomepageHero()]);
  const buyerCount = accounts.filter((a) => a.status === "active").length;
  const newest = styles.filter((s) => s.newArrival).slice(0, 8);
  // Two weeks out by default — enough notice for a shop to put an order together.
  const defaultOrderBy = estimatedArrivalIso(14);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">Buyer emails</h1>
      <p className="mt-3 text-sm text-ink-soft">
        One email to every buyer, in their own language: your newest styles, an &ldquo;order by&rdquo; date and when their
        boxes will be ready, with buttons to the new styles and the order sheet. Send it at the start of each season and a
        week before the order-by date.
      </p>
      <div className="mt-5 border border-stone-300 bg-stone-50 p-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Newest styles included ({newest.length})</p>
        {newest.length ? (
          <ul className="mt-2 list-disc pl-5 text-ink">
            {newest.map((s) => (
              <li key={s.id}>{s.name}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-ink-soft">None flagged — tick &ldquo;New arrival&rdquo; on products to include them.</p>
        )}
      </div>
      <div className="mt-6">
        <SeasonReminderForm buyerCount={buyerCount} leadTimeDays={hero.productionLeadTimeDays} defaultOrderBy={defaultOrderBy} />
      </div>
    </div>
  );
}
