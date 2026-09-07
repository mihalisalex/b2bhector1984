import { getStorefrontStyles } from "@/lib/data/styles";
import { getAllAccounts } from "@/lib/data/accounts";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { CATEGORY_LABEL } from "@/lib/data/styleLabels";
import { getUnitPrice } from "@/lib/pricing";
import { resolveLocale } from "@/lib/localeHeuristic";
import { ProformaBuilder, type ProformaAccount, type ProformaStyle } from "@/components/admin/proforma/ProformaBuilder";

export const metadata = { title: "Proforma Builder", robots: { index: false, follow: false } };

/**
 * Build a proforma for anyone, from the real catalogue, without them having an account.
 *
 * The page shape is deliberate: everything the builder needs is computed here, on the
 * server, and handed down as plain data. In particular the per-terms unit prices are
 * precomputed with the same `getUnitPrice` the checkout uses, so the running total the
 * admin reads on screen and the figure the PDF prints come from one source. A second
 * pricing implementation in the browser is how a quote ends up disagreeing with its own
 * invoice.
 */
export default async function AdminProformaPage() {
  const [styles, accounts] = await Promise.all([getStorefrontStyles(), getAllAccounts()]);

  const styleData: ProformaStyle[] = styles
    .map((style) => ({
      id: style.id,
      name: style.name,
      styleNumber: style.styleNumber,
      category: CATEGORY_LABEL[style.category] ?? style.category,
      vatRate: style.vatRate,
      colorways: style.colorways.map((c) => ({ id: c.id, name: c.name })),
      // Every style in this catalogue currently has exactly one box format; the builder
      // still renders a picker because the column allows more and one day may hold them.
      boxTypes: getAvailableBoxTypes(style).map((b) => ({ id: b.id, label: b.label, totalPairs: b.totalPairs })),
      unitPriceByTerms: {
        prepay: getUnitPrice(style, "prepay"),
        net30: getUnitPrice(style, "net30"),
        net60: getUnitPrice(style, "net60"),
      },
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  const accountData: ProformaAccount[] = accounts.map((a) => ({
    id: a.id,
    businessName: a.businessName,
    contactName: a.contactName,
    email: a.email,
    priceMultiplier: a.priceMultiplier,
    // Same resolution the order invoice uses: the stored locale, else a guess from the
    // store location. An account with no language on file still gets a sensible default
    // rather than the admin's own.
    locale: resolveLocale(a.locale, a.storeLocation),
    shipTo: a.shipTo.map((s) => ({
      label: s.label,
      line1: s.line1,
      line2: s.line2,
      city: s.city,
      state: s.state,
      zip: s.zip,
      isDefault: s.isDefault,
    })),
  }));

  return (
    <div>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        Proforma Builder
      </h1>
      <p className="mt-4 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
        Build a proforma for anyone — an existing account, or a retailer standing in front of you with no account at
        all. It produces a PDF you can print or email. Nothing is saved: no order is created, no stock is reserved,
        and nothing appears in anyone&rsquo;s order history.
      </p>

      {styleData.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center text-sm text-ink-soft">
          No active products to quote from.
        </div>
      ) : (
        <ProformaBuilder styles={styleData} accounts={accountData} />
      )}
    </div>
  );
}
