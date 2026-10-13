import { getAllAccounts } from "@/lib/data/accounts";
import { getStorefrontStyles } from "@/lib/data/styles";
import { requireAdmin } from "@/lib/adminGuard";
import { CampaignForm } from "@/components/admin/CampaignForm";

export const metadata = { title: "Buyer emails", robots: { index: false, follow: false } };

/** How many recent styles the picker offers; the newest six start picked. */
const PICKER_SIZE = 12;

/** "New styles" email to every buyer: pick styles, generate or write the text, test, send. */
export default async function BuyerEmailsPage() {
  const [admin, accounts, styles] = await Promise.all([requireAdmin(), getAllAccounts(), getStorefrontStyles()]);
  const buyerCount = accounts.filter((a) => a.status === "active").length;
  const recent = styles
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, PICKER_SIZE)
    .map((s) => ({ id: s.id, name: s.name, slug: s.slug, category: s.category, imageUrl: s.primaryImageUrl }));

  return (
    <div className="max-w-6xl">
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">Buyer emails</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Show your buyers what&rsquo;s new. Pick the styles, press <strong>Generate text</strong> (or write your own), check the
        preview, send yourself a test — then send it to everyone.
      </p>
      <div className="mt-8">
        <CampaignForm styles={recent} buyerCount={buyerCount} adminEmail={admin.email} adminName={admin.contactName} />
      </div>
    </div>
  );
}
