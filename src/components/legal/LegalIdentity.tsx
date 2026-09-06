import { identityRows } from "@/lib/legalEntity";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";

/**
 * The trader-identification block at the top of the Terms and the Privacy Policy.
 *
 * Greek e-commerce law (Π.Δ. 131/2003, transposing Directive 2000/31/EC) requires a trader
 * to state who they are, where they are established and how to reach them, and the GDPR
 * requires a privacy policy to identify the controller. This is the one block that answers
 * both, which is why it is a component rather than more dictionary prose: the facts live in
 * src/lib/legalEntity.ts once and render identically in four languages.
 *
 * Deliberately a server component with no hooks. It takes `dict` as a prop rather than
 * reading `useI18n()` — a client hook called from a server component is the bug that has
 * taken this site down twice, and a component used only by two statically-rendered legal
 * pages has no reason to ship JavaScript at all.
 *
 * Rows with no value are dropped upstream by `identityRows`, so an identifier the company
 * has not supplied yet is simply absent. A legal page showing "Γ.Ε.ΜΗ.: —" invites the
 * question of whether the company has one; showing nothing does not.
 */
export function LegalIdentity({ locale, dict }: { locale: Locale; dict: Dictionary["legal"] }) {
  const rows = identityRows(locale, {
    registeredName: dict.identityRegisteredName,
    tradingName: dict.identityTradingName,
    address: dict.identityAddress,
    vatId: dict.identityVatId,
    taxOffice: dict.identityTaxOffice,
    gemi: dict.identityGemi,
    email: dict.identityEmail,
    phone: dict.identityPhone,
  });

  return (
    <section className="mx-auto max-w-[900px] px-6 lg:px-10">
      <div className="border-t border-stone-300 pt-8">
        <h2 className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{dict.identityHeading}</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
          {rows.map((row) => (
            <div key={row.label} className="contents">
              <dt className="text-sm font-semibold uppercase tracking-wide text-ink">{row.label}</dt>
              <dd className="text-sm leading-relaxed text-ink-soft">{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
