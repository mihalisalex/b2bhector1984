import Link from "next/link";
import type { Metadata } from "next";
import { LinkButton } from "@/components/ui/Button";
import { CookieChoice } from "@/components/analytics/CookieChoice";
import { getDictionary } from "@/i18n/getDictionary";
import { withLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const l = (await getDictionary(lang as Locale)).legal;
  return { title: l.cookiesTitle, description: l.cookiesDescription, robots: { index: false, follow: false } };
}

export default async function CookiesPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const l = (await getDictionary(locale)).legal;

  // Every row describes a cookie this site actually sets: `hector_session` and
  // `hector_application` from the app itself, plus the two Google Analytics cookies added
  // with the GA tag. A row without its cookie, or a cookie without its row, is how a
  // cookie notice starts lying — keep them in step.
  const cookies = [
    { name: l.cookie1Name, purpose: l.cookie1Purpose, type: l.cookie1Type },
    { name: l.cookie2Name, purpose: l.cookie2Purpose, type: l.cookie2Type },
    { name: l.cookie3Name, purpose: l.cookie3Purpose, type: l.cookie3Type },
    { name: l.cookie4Name, purpose: l.cookie4Purpose, type: l.cookie4Type },
  ];

  return (
    <div>
      {/* Flat, left-aligned header — matches /collections instead of the centered
          stone-100 card this used to open with. */}
      <div className="mx-auto max-w-[900px] px-6 pb-4 pt-12 lg:px-10">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{l.eyebrow}</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-4xl">
          {l.cookiesTitle}
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-soft">{l.disclaimer}</p>
      </div>

      <section className="mx-auto max-w-[900px] px-6 py-12 lg:px-10">
        <p className="max-w-[65ch] text-sm leading-relaxed text-ink-soft">{l.cookiesIntro}</p>

        <div className="scroll-thin mt-8 overflow-x-auto border border-stone-300 bg-white">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-2.5 font-semibold">{l.cookieColName}</th>
                <th className="px-4 py-2.5 font-semibold">{l.cookieColPurpose}</th>
                <th className="px-4 py-2.5 font-semibold">{l.cookieColType}</th>
              </tr>
            </thead>
            <tbody>
              {cookies.map((c) => (
                <tr key={c.name} className="border-b border-stone-200 last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{c.name}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{c.purpose}</td>
                  <td className="px-4 py-2.5 text-ink-soft">{c.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-[65ch] text-sm leading-relaxed text-ink-soft">{l.cookiesOutro}</p>

        {/* The live control, not a description of one: consent that cannot be withdrawn as
            easily as it was given is not consent. */}
        <CookieChoice />
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              {l.cookiesCtaHeading}
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">
              <Link href={withLocale(locale, "/contact")} className="underline underline-offset-2 hover:text-white">
                {l.contactUs}
              </Link>{" "}
              {l.contactSuffix}
            </p>
          </div>
          <LinkButton href={withLocale(locale, "/privacy")} size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            {l.cookiesCtaButton}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
