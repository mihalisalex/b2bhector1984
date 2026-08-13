import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.brandStoryTitle,
    description: dict.seo.brandStoryDescription,
    path: "/brand-story",
    locale,
    // Body copy is now genuinely translated (not just chrome) across all four locales —
    // see dict.brandStory — so this can carry real hreflang alternates.
  });
}

export default async function BrandStoryPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const b = dict.brandStory;
  const heroLines = b.heroHeading.split("\n");

  return (
    <div>
      {/* Big, confident header — same left-aligned flat treatment as /collections, but
          sized up to the homepage's scale rather than a modest text-3xl. This page is the
          brand's own "about us" — it should carry real typographic weight. */}
      <div className="mx-auto max-w-[1200px] px-6 pb-6 pt-16 lg:px-10 lg:pt-24">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{b.estSince}</span>
        <h1 className="font-display mt-4 max-w-3xl text-5xl font-bold uppercase leading-[0.98] tracking-tight text-ink sm:text-6xl lg:text-7xl">
          {heroLines.map((line, i) => (
            <span key={i}>
              {line}
              {i < heroLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
      </div>

      <section className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-16 px-6 py-16 lg:grid-cols-2 lg:py-24 lg:px-10">
        <div className="flex flex-col gap-6 text-[15px] leading-relaxed text-ink-soft lg:order-2">
          <p>{b.intro1}</p>
          <p>{b.intro2}</p>
          <p>{b.intro3}</p>
        </div>
        <StylePlate
          swatch={["#1a1d22", "#c1451e"]}
          imageUrl="/images/brand/storefront-1984.png"
          alt={b.estSince}
          className="aspect-[4/5] w-full lg:order-1"
          priority
        />
      </section>

      {/* Materials — off the shaded stone-100 box, onto the plain page background, with
          the same large faint index-number motif the homepage's numbered steps use, so it
          reads as one deliberate system rather than one page's own one-off decoration. */}
      <section id="materials" className="border-t border-stone-300 px-6 py-16 lg:py-24 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-display max-w-lg text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
            {b.materialsHeading}
          </h2>
          <div className="mt-14 grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-3">
            <Material n="01" title={b.material1Title} body={b.material1Body} />
            <Material n="02" title={b.material2Title} body={b.material2Body} />
            <Material n="03" title={b.material3Title} body={b.material3Body} />
          </div>
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">{b.ctaHeading}</h2>
            <p className="mt-1 text-sm text-stone-300/80">{b.ctaBody}</p>
          </div>
          <LinkButton href={withLocale(locale, "/collections")} size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            {b.ctaButton}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

function Material({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -top-10 left-0 select-none text-6xl font-semibold leading-none text-stone-200"
      >
        {n}
      </span>
      <div className="relative">
        <h3 className="font-display text-base font-bold uppercase tracking-tight text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
      </div>
    </div>
  );
}
