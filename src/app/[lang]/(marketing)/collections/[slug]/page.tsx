import Link from "next/link";
import { notFound } from "next/navigation";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getStyleImageUrl } from "@/lib/data/styleLabels";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { CATEGORY_PAGES, getCategoryPageBySlug } from "@/lib/categoryPages";
import { pageMetadata } from "@/lib/seo";
import { buildBreadcrumbSchema, buildCollectionSchema, buildFaqSchema } from "@/lib/seoJsonLd";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StylePlate } from "@/components/product/StylePlate";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { getDictionary } from "@/i18n/getDictionary";
import { t } from "@/i18n/format";
import { withLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";

/**
 * One indexable landing page per product category — see `categoryPages.ts` for why they
 * exist and where the copy comes from. The product grid is the real storefront range for the
 * category, rendered server-side so a crawler sees every product link; like /collections it
 * is public and shows no prices.
 */
export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const page = getCategoryPageBySlug(slug);
  if (!page) return {};
  const copy = page.copy[lang as Locale];
  return pageMetadata({
    title: copy.title,
    description: copy.description,
    path: `/collections/${page.slug}`,
    locale: lang as Locale,
  });
}

export default async function CategoryLandingPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const locale = lang as Locale;
  const page = getCategoryPageBySlug(slug);
  if (!page) notFound();

  const [allStyles, settings, dict] = await Promise.all([getStorefrontStyles(), getSeoSettings(), getDictionary(locale)]);
  const copy = page.copy[locale];
  const d = dict.collections;
  const styles = allStyles.filter((style) => style.category === page.category);
  const path = withLocale(locale, `/collections/${page.slug}`);

  const trail = [
    { name: dict.catalog.home, path: withLocale(locale, "/") },
    { name: d.allCollections, path: withLocale(locale, "/collections") },
    { name: copy.label, path },
  ];
  const schemas = [
    buildBreadcrumbSchema(trail, settings, locale),
    buildCollectionSchema({
      name: copy.h1,
      description: copy.description,
      path,
      items: styles.map((style) => ({
        name: style.name,
        path: withLocale(locale, `/product/${style.slug}`),
        imageUrl: getStyleImageUrl(style),
      })),
      locale,
    }),
    buildFaqSchema(copy.faq, settings),
  ].filter((schema): schema is NonNullable<typeof schema> => schema !== null);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <JsonLd schema={schemas} />
      <Breadcrumbs trail={trail} dict={dict} />

      <header className="mt-6 max-w-3xl">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{d.eyebrow}</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">{copy.h1}</h1>
        <div className="mt-4 flex flex-col gap-3 text-[15px] leading-relaxed text-ink-soft">
          {copy.intro.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>
      </header>

      <section className="mt-12">
        <p className="font-mono-tab text-xs text-ink-soft">{t(d.resultsCount, { count: styles.length })}</p>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
          {styles.map((style, i) => (
            <Link key={style.id} href={withLocale(locale, `/product/${style.slug}`)} className="group block">
              <div className="relative overflow-hidden bg-stone-100">
                <StylePlate
                  swatch={style.colorways[0].swatch}
                  imageUrl={getStyleImageUrl(style)}
                  alt={style.name}
                  // First row is the likely LCP element on mobile and desktop alike.
                  priority={i < 4}
                  className="aspect-[4/5] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
                <div className="absolute left-2 top-2">
                  <AvailabilityBadge style={style} />
                </div>
              </div>
              <h2 className="font-display mt-3 text-sm font-semibold uppercase tracking-tight text-ink transition-colors group-hover:text-signal sm:text-base">
                {style.name}
              </h2>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-16 max-w-3xl border-t border-stone-300 pt-10">
        <h2 className="font-display text-xl font-bold uppercase tracking-tight text-ink">{d.faqHeading}</h2>
        <div className="mt-2 divide-y divide-stone-200">
          {copy.faq.map((item) => (
            <details key={item.q} className="group py-5 transition-colors hover:bg-stone-50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-1 text-[15px] font-semibold text-ink marker:content-none">
                {item.q}
                <span aria-hidden className="relative flex h-6 w-6 shrink-0 items-center justify-center text-ink-soft">
                  <span className="absolute h-[1.5px] w-3.5 bg-current transition-transform duration-200 group-open:rotate-180" />
                  <span className="absolute h-3.5 w-[1.5px] bg-current transition-transform duration-200 group-open:rotate-90 group-open:opacity-0" />
                </span>
              </summary>
              <p className="mt-3 max-w-[65ch] px-1 text-sm leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <nav aria-label={d.browseByCategory} className="mt-16 border-t border-stone-300 pt-10">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.browseByCategory}</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {CATEGORY_PAGES.filter((other) => other.slug !== page.slug).map((other) => (
            <li key={other.slug}>
              <Link
                href={withLocale(locale, `/collections/${other.slug}`)}
                className="inline-block border border-stone-300 px-3 py-1.5 text-sm text-ink transition-colors hover:border-ink"
              >
                {other.copy[locale].label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-16 flex flex-col items-center gap-3 border-t border-stone-300 pt-10 text-center">
        <p className="text-sm text-ink-soft">{d.notWholesaleYet}</p>
        <LinkButton href={withLocale(locale, "/apply")} size="lg">
          {dict.nav.applyForAccess}
        </LinkButton>
      </div>
    </div>
  );
}
