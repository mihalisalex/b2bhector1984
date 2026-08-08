import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.contactTitle,
    description: dict.seo.contactDescription,
    path: "/contact",
    locale,
    // Fully translated now (dict.contact) across all four locales.
  });
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const c = dict.contact;
  const headingLines = c.heading.split("\n");

  return (
    <div>
      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{c.eyebrow}</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            {headingLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headingLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-soft">{c.intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-20 lg:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <ContactCard
            title={c.generalTitle}
            body={c.generalBody}
            lines={[{ href: "mailto:info@hectorfootwear.gr", label: "info@hectorfootwear.gr" }]}
          />
          <ContactCard
            title={c.newAccountsTitle}
            body={c.newAccountsBody}
            lines={[{ href: "mailto:info@hectorfootwear.gr", label: "info@hectorfootwear.gr" }]}
          />
          <ContactCard
            title={c.existingBuyersTitle}
            body={c.existingBuyersBody}
            lines={[{ href: withLocale(locale, "/dashboard"), label: c.goToDashboard }]}
          />
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              {dict.collections.notWholesaleYet}
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">{c.applicationsReviewed}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={withLocale(locale, "/apply")} size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
              {dict.nav.applyForAccess}
            </LinkButton>
            <LinkButton
              href={withLocale(locale, "/login")}
              variant="secondary"
              size="lg"
              className="!border-white !text-white hover:!bg-white hover:!text-ink"
            >
              {dict.nav.buyerLogin}
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({
  title,
  body,
  lines,
}: {
  title: string;
  body: string;
  lines: { href: string; label: string }[];
}) {
  return (
    <div className="flex flex-col border border-stone-300 bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(26,29,34,0.1)]">
      <h3 className="font-display text-base font-bold uppercase tracking-tight text-ink">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-4 flex flex-col gap-1.5 border-t border-stone-200 pt-4">
        {lines.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-semibold text-signal hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
