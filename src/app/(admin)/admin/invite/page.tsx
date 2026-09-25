import { listApplications } from "@/lib/data/applications";
import { getAllSalesReps } from "@/lib/data/salesReps";
import { InviteShopForm } from "@/components/admin/InviteShopForm";
import { countryOptions } from "@/lib/countries";
import { urlForLocale } from "@/i18n/domains";
import { getDictionary } from "@/i18n/getDictionary";
import { t } from "@/i18n/format";
import { waLinkTo } from "@/lib/whatsapp";
import { formatDate } from "@/lib/format";
import type { Locale } from "@/i18n/config";

export const metadata = { title: "Invite a shop", robots: { index: false, follow: false } };

/**
 * Invite shops the business already sells to — the way the ~80 existing retailers get onto
 * the site without each filling in an application. Below the form: everyone approved who
 * hasn't set a password yet, with their link and a WhatsApp nudge.
 */
export default async function InviteShopPage() {
  const [approved, reps, el, en] = await Promise.all([
    listApplications("approved"),
    getAllSalesReps(),
    getDictionary("el"),
    getDictionary("en"),
  ]);

  const waiting = approved.map((a) => {
    const locale: Locale = a.country === "GR" || a.country === "CY" ? "el" : "en";
    const link = urlForLocale(locale, `/apply/pending?app=${a.id}`);
    const e = (locale === "el" ? el : en).email;
    const whatsapp = waLinkTo(a.phone, t(e.inviteWhatsapp, { name: a.contactName.split(" ")[0] || a.contactName, business: a.businessName, link }));
    return { ...a, link, whatsapp };
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">Invite a shop</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        For shops you already sell to. They skip the application: the account is approved straight away, and the shop
        gets an email (and, if you add a mobile, a WhatsApp you send with one tap) with a link to set a password and
        see their prices.
      </p>

      <div className="mt-6">
        <InviteShopForm
          countries={countryOptions("en", "Other")}
          reps={reps.map((r) => ({ id: r.id, name: r.name }))}
        />
      </div>

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Waiting to set a password ({waiting.length})
      </h2>
      {waiting.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Nobody — every approved shop has activated its account.</p>
      ) : (
        <div className="mt-3 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-semibold">Shop</th>
                <th className="px-4 py-2.5 font-semibold">Approved</th>
                <th className="px-4 py-2.5 font-semibold">Nudge</th>
              </tr>
            </thead>
            <tbody>
              {waiting.map((a) => (
                <tr key={a.id} className="border-b border-stone-200 last:border-b-0 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{a.businessName}</p>
                    <p className="text-xs text-ink-soft">
                      {a.contactName} · {a.email}
                      {a.phone ? ` · ${a.phone}` : ""} · {a.country}
                    </p>
                    <p className="mt-1 break-all font-mono-tab text-[11px] text-ink-soft">{a.link}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">{formatDate(a.submittedAt)}</td>
                  <td className="px-4 py-3">
                    {a.whatsapp ? (
                      <a href={a.whatsapp} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-positive underline">
                        WhatsApp the link
                      </a>
                    ) : (
                      <span className="text-xs text-ink-soft">No mobile — resend from Applications</span>
                    )}
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
