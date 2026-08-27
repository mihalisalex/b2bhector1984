import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { getDictionary } from "@/i18n/getDictionary";
import { withLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const l = (await getDictionary(lang as Locale)).legal;
  return { title: l.termsTitle, description: l.termsDescription, robots: { index: false, follow: false } };
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
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">{l.disclaimer}</p>
      </div>

      <section className="mx-auto max-w-[900px] px-6 py-12 lg:px-10">
        <div className="flex flex-col gap-8">
          {clauses.map((clause) => (
            <div key={clause.q} className="border-t border-stone-300 pt-6">
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{clause.q}</h2>
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
