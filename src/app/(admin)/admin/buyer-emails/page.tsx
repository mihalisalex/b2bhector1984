import { getAllAccounts } from "@/lib/data/accounts";
import { getStorefrontStyles } from "@/lib/data/styles";
import { requireAdmin } from "@/lib/adminGuard";
import { activePresets } from "@/lib/campaignEmail";
import { CampaignForm } from "@/components/admin/CampaignForm";

export const metadata = { title: "Buyer emails", robots: { index: false, follow: false } };

/**
 * Campaign email to every buyer: pick styles, generate or write the text (or start from a
 * ready-made campaign), check the live preview, test, send. `?preset=<id>` opens a
 * ready-made campaign directly.
 */
export default async function BuyerEmailsPage({ searchParams }: { searchParams: Promise<{ preset?: string }> }) {
  const [admin, accounts, styles, { preset }] = await Promise.all([requireAdmin(), getAllAccounts(), getStorefrontStyles(), searchParams]);
  const buyerCount = accounts.filter((a) => a.status === "active").length;
  const newestFirst = styles
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((s) => ({ id: s.id, name: s.name, slug: s.slug, category: s.category, season: s.season, imageUrl: s.primaryImageUrl }));
  const presets = activePresets(new Date().toISOString().slice(0, 10));

  return (
    <div className="max-w-6xl">
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">Buyer emails</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Show your buyers what&rsquo;s new. Start from a ready-made campaign or pick the styles and press{" "}
        <strong>Generate text</strong>. Check the preview, send yourself a test, then send it to everyone.
      </p>
      <div className="mt-8">
        <CampaignForm
          styles={newestFirst}
          presets={presets}
          initialPresetId={presets.some((p) => p.id === preset) ? preset : undefined}
          buyerCount={buyerCount}
          adminEmail={admin.email}
          adminName={admin.contactName}
        />
      </div>
    </div>
  );
}
