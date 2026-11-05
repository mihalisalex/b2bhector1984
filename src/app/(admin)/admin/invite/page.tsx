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

export const metadata = { title: "Πρόσκληση καταστήματος", robots: { index: false, follow: false } };

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
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">Πρόσκληση καταστήματος</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft">
        Για καταστήματα που ήδη εξυπηρετείς. Δεν κάνουν αίτηση: ο λογαριασμός εγκρίνεται αμέσως και το κατάστημα παίρνει email (και WhatsApp με ένα πάτημα, αν βάλεις κινητό) με link για να ορίσει κωδικό και να δει τις τιμές του.
      </p>

      <div className="mt-6">
        <InviteShopForm
          countries={countryOptions("en", "Other")}
          reps={reps.map((r) => ({ id: r.id, name: r.name }))}
        />
      </div>

      <h2 className="mt-12 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Περιμένουν να ορίσουν κωδικό ({waiting.length})
      </h2>
      {waiting.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">Κανένα: όλα τα εγκεκριμένα καταστήματα έχουν ενεργοποιήσει λογαριασμό.</p>
      ) : (
        <div className="mt-3 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-semibold">Κατάστημα</th>
                <th className="px-4 py-2.5 font-semibold">Εγκρίθηκε</th>
                <th className="px-4 py-2.5 font-semibold">Υπενθύμιση</th>
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
                        Στείλε το link με WhatsApp
                      </a>
                    ) : (
                      <span className="text-xs text-ink-soft">Χωρίς κινητό: ξαναστείλε από τις Αιτήσεις</span>
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
