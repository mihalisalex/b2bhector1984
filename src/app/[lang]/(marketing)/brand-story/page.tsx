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
      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">{b.estSince}</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            {heroLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < heroLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10">
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
          <p>{b.intro1}</p>
          <p>{b.intro2}</p>
          <p>{b.intro3}</p>
        </div>
        <StylePlate swatch={["#1a1d22", "#c1451e"]} styleNumber="HL-1001" className="aspect-square w-full" />
      </section>

      <section id="materials" className="border-t border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {b.materialsHeading}
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Material title={b.material1Title} body={b.material1Body} />
            <Material title={b.material2Title} body={b.material2Body} />
            <Material title={b.material3Title} body={b.material3Body} />
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

function Material({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="font-display text-sm font-bold uppercase tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
