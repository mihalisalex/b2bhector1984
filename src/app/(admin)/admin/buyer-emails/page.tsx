import { getAllAccounts } from "@/lib/data/accounts";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { requireAdmin } from "@/lib/adminGuard";
import { SeasonReminderForm } from "@/components/admin/SeasonReminderForm";

export const metadata = { title: "Buyer emails", robots: { index: false, follow: false } };

/** How many recent styles the picker offers; the newest six start ticked. */
const PICKER_SIZE = 12;

/** "New styles" email to every buyer: photo cards of the newest styles, with a test send first. */
export default async function BuyerEmailsPage() {
  const [admin, accounts, styles, hero] = await Promise.all([requireAdmin(), getAllAccounts(), getStorefrontStyles(), getHomepageHero()]);
  const buyerCount = accounts.filter((a) => a.status === "active").length;
  const recent = styles
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, PICKER_SIZE)
    .map((s) => ({ id: s.id, name: s.name, imageUrl: s.primaryImageUrl, addedOn: s.createdAt.slice(0, 10) }));

  return (
    <div className="max-w-3xl">
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">Buyer emails</h1>
      <p className="mt-3 text-sm text-ink-soft">
        One email to every buyer with photos of your newest styles, how long production takes (or an &ldquo;order by&rdquo;
        date), and buttons to the new styles and the order sheet. Send yourself a test first — it arrives exactly as buyers
        will see it.
      </p>
      <div className="mt-6">
        <SeasonReminderForm
          buyerCount={buyerCount}
          leadTimeDays={hero.productionLeadTimeDays}
          styles={recent}
          adminEmail={admin.email}
        />
      </div>
    </div>
  );
}
