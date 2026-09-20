import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { LegalIdentity } from "@/components/legal/LegalIdentity";
import { getDictionary } from "@/i18n/getDictionary";
import { pageMetadata } from "@/lib/seo";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import { LEGAL_ENTITY, formatLastUpdated } from "@/lib/legalEntity";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const locale = lang as Locale;
  const l = (await getDictionary(locale)).legal;
  // Indexable since 2026-09-20, and through `pageMetadata` like every other public page.
  // These were noindex for as long as they were placeholder text, and returned a bare
  // object — no canonical, no hreflang — which was harmless while nothing could index them
  // and would have been a duplicate-content problem the moment something could: the same
  // page exists at four URLs across two domains, and a crawler needs to be told which is
  // which.
  return pageMetadata({ title: l.termsTitle, description: l.termsDescription, path: "/terms", locale });
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const l = (await getDictionary(locale)).legal;

  // Numbered keys rather than an array of clauses: a missing translation then fails to
  // compile instead of silently rendering the wrong language, which is the whole reason
  // these dictionaries are .ts files.
  const clauses = [
    { q: l.termsQ1, a: l.termsA1 },
    { q: l.termsQ2, a: l.termsA2 },
    { q: l.termsQ3, a: l.termsA3 },
    { q: l.termsQ4, a: l.termsA4 },
    { q: l.termsQ5, a: l.termsA5 },
    { q: l.termsQ6, a: l.termsA6 },
    { q: l.termsQ7, a: l.termsA7 },
    { q: l.termsQ8, a: l.termsA8 },
    { q: l.termsQ9, a: l.termsA9 },
    { q: l.termsQ10, a: l.termsA10 },
    { q: l.termsQ11, a: l.termsA11 },
    { q: l.termsQ12, a: l.termsA12 },
    { q: l.termsQ13, a: l.termsA13 },
    { q: l.termsQ14, a: l.termsA14 },
    { q: l.termsQ15, a: l.termsA15 },
    { q: l.termsQ16, a: l.termsA16 },
    { q: l.termsQ17, a: l.termsA17 },
    { q: l.termsQ18, a: l.termsA18 },
    { q: l.termsQ19, a: l.termsA19 },
    { q: l.termsQ20, a: l.termsA20 },
    { q: l.termsQ21, a: l.termsA21 },
    // The only clause carrying a value from outside the dictionary: the competent court
    // follows the registered seat, so it lives with the rest of the company's identity.
    { q: l.termsQ22, a: l.termsA22 },
    { q: l.termsQ23, a: t(l.termsA23, { city: LEGAL_ENTITY.jurisdictionCity[locale] }) },
  ];

  return (
    <div>
      {/* Flat, left-aligned header — matches /collections instead of the centered
          stone-100 card this used to open with. */}
      <div className="mx-auto max-w-[900px] px-6 pb-4 pt-12 lg:px-10">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{l.eyebrow}</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-4xl">
          {l.termsTitle}
        </h1>
        <p className="mt-3 max-w-[65ch] text-sm leading-relaxed text-ink-soft">{l.termsIntro}</p>
        <p className="font-mono-tab mt-3 text-xs uppercase tracking-[0.2em] text-ink-soft">
          {t(l.lastUpdated, { date: formatLastUpdated(locale) })}
        </p>
      </div>

      <LegalIdentity locale={locale} dict={l} />

      <section className="mx-auto max-w-[900px] px-6 py-12 lg:px-10">
        <div className="divide-y divide-stone-200">
          {clauses.map((clause, i) => (
            <div key={clause.q} className="py-5">
              {/* Numbered because these get cited. A buyer disputing a delivery refers to
                  clause 13, and a document whose clauses have no numbers cannot be argued
                  from. Uses the eyebrow treatment already on the page rather than a new one. */}
              <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-1 text-sm font-semibold uppercase tracking-wide text-ink">{clause.q}</h2>
              <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-ink-soft">{clause.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              {l.termsCtaHeading}
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">
              <Link href={withLocale(locale, "/contact")} className="underline underline-offset-2 hover:text-white">
                {l.contactUs}
              </Link>{" "}
              {l.contactSuffix}
            </p>
          </div>
          <LinkButton href={withLocale(locale, "/faq")} size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            {l.termsCtaButton}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
