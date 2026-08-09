import Image from "next/image";
import Link from "next/link";
import { getStorefrontStyles, CATEGORY_LABEL, getStyleImageUrl } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { getSeasonSettings, toSeasonOptions } from "@/lib/data/seasonSettings";
import type { Category, Season } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";

/** Declared here (not inherited from the root layout's defaults) so the homepage gets its
 * own canonical, hreflang set, and a self-referencing og:url like every other indexed page.
 * Locale-aware since 2026-08-09 — title/description now come from each locale's own
 * `dict.seo` copy instead of a single hardcoded English string reused under every prefix. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.homeTitle,
    description: dict.seo.homeDescription,
    path: "/",
    locale,
  });
}

const SEASON_CATEGORIES: Record<Season, Category[]> = {
  summer: ["loafers", "wedding", "sneakers", "sandals"],
  winter: ["boots", "sneakers", "formal", "anatomic"],
};

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  const lang = rawLang as Locale;
  const [styles, hero, seasonSettings, dict] = await Promise.all([
    getStorefrontStyles(),
    getHomepageHero(),
    getSeasonSettings(),
    getDictionary(lang),
  ]);
  const h = dict.home;
  const seasonOptions = toSeasonOptions(seasonSettings);
  // The hero's eyebrow/heading/body are admin-edited via /admin/content, but that editor
  // only ever writes one (English) row — there's no per-locale content model for it yet
  // (Phase 2 of the i18n work, deferred — see the i18n Phase 1 write-up). Rather than show
  // the same English hero copy under /de, /fr and /el, non-English locales get dictionary-
  // authored hero copy instead; English keeps using the admin's live DB content exactly as
  // before, so the admin's editing workflow is completely unaffected.
  const isEnglishHero = lang === "en";
  const displayEyebrow = isEnglishHero ? hero.eyebrow : h.heroEyebrow;
  const displayHeadingRaw = isEnglishHero ? hero.heading : h.heroHeading;
  const displayBody = isEnglishHero ? hero.body : h.heroBody;
  // Admin-edited content occasionally carries a stray blank line between sentences; filtered
  // here so it can't open up an oversized gap in the middle of the headline (a blank line
  // still renders as a full leading-height row even though there's nothing on it).
  const headingLines = displayHeadingRaw.split("\n").filter((line) => line.trim() !== "");

  return (
    <div>
      {/* Hero — `min-h-*` (not a fixed `h-*`) on the content wrapper, so the box always grows
          to fit however tall the admin-edited heading/body actually is (no clipping), while
          still guaranteeing a floor on short content so `object-cover` never has to crop the
          photo into a thin strip on a very wide screen. The section itself has no height of
          its own — it just wraps this div, whose min-height + real content sets it. */}
      <section className="relative overflow-hidden border-b border-stone-300 bg-ink">
        <Image
          src={hero.heroImageUrl}
          alt={h.heroImageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(105deg, rgba(8,9,11,0.75) 0%, rgba(8,9,11,0.55) 32%, rgba(8,9,11,0.15) 60%, rgba(8,9,11,0.4) 100%)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden />

        <div className="relative mx-auto flex min-h-[520px] max-w-[1440px] items-center px-6 py-16 sm:min-h-[560px] lg:min-h-[640px] lg:px-10 2xl:min-h-[720px]">
          <div className="max-w-xl lg:max-w-2xl">
            <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-stone-300/70">
              {displayEyebrow}
            </span>
            <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {headingLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < headingLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={withLocale(lang, hero.primaryCtaHref)} size="lg">
                {hero.primaryCtaLabel}
              </LinkButton>
              <LinkButton
                href={withLocale(lang, hero.secondaryCtaHref)}
                variant="secondary"
                size="lg"
                className="!border-white !text-white hover:!bg-white hover:!text-ink"
              >
                {hero.secondaryCtaLabel}
              </LinkButton>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-300/80">
              {displayBody}
            </p>
            <Link
              href={withLocale(lang, "/collections")}
              className="mt-3 inline-block text-sm font-medium text-stone-300 underline underline-offset-2 hover:text-white"
            >
              {h.viewCollectionFirst} →
            </Link>
          </div>
        </div>
      </section>

      {/* Easy steps to order, right up top for first-time buyers */}
      <section className="border-b border-stone-300 bg-white py-16">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-10">
            <QuickStep n="01" title={h.step1Title} body={h.step1Body} href={withLocale(lang, "/apply")} cta={h.step1Cta} />
            <QuickStep n="02" title={h.step2Title} body={h.step2Body} href={withLocale(lang, "/login")} cta={h.step2Cta} />
            <QuickStep n="03" title={h.step3Title} body={h.step3Body} href={withLocale(lang, "/quick-order")} cta={h.step3Cta} />
          </div>
        </div>
      </section>

      {/* Season spotlight — one full-width editorial row per enabled season, alternating
          text/image sides, instead of a 2-up grid that left a dead cell whenever a season
          had no styles yet (see the homepage redesign discussion for why). */}
      {seasonOptions.map(({ value: season, label }, index) => {
        // A "both" style belongs to Summer and Winter at once, so it counts toward each
        // season's spotlight row regardless of which one is being rendered.
        const seasonStyles = styles.filter((s) => s.season === season || s.season === "both");
        const rep = seasonStyles[0];
        if (!rep) return null;
        const imageUrl = seasonSettings[season].teaserImageUrl || getStyleImageUrl(rep);
        const imageOnRight = index % 2 === 0;

        const imagePanel = (
          <Link
            href={withLocale(lang, `/collections?season=${season}`)}
            className="group relative block aspect-[4/3] overflow-hidden bg-ink sm:aspect-[4/3] lg:aspect-[3/2]"
          >
            <StylePlate
              swatch={rep.colorways[0].swatch}
              imageUrl={imageUrl}
              alt={rep.name}
              priority={index === 0}
              className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div
              className="absolute inset-0"
              style={{
                background: imageOnRight
                  ? "linear-gradient(260deg, rgba(8,9,11,0.5) 0%, rgba(8,9,11,0.02) 40%)"
                  : "linear-gradient(100deg, rgba(8,9,11,0.5) 0%, rgba(8,9,11,0.02) 40%)",
              }}
              aria-hidden
            />
            <span
              aria-hidden
              className="font-display absolute top-4 text-6xl font-extrabold leading-none text-white/20 sm:text-7xl"
              style={imageOnRight ? { right: "1rem" } : { left: "1rem" }}
            >
              {String(index + 1).padStart(2, "0")}
            </span>
          </Link>
        );

        const textPanel = (
          <div className="flex flex-col justify-center px-6 py-12 lg:px-14">
            <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">
              {index === 0 ? h.currentDrop : h.alsoAvailable}
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-3xl">
              {label}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              {t(h.stylesCount, {
                count: seasonStyles.length,
                categories: SEASON_CATEGORIES[season].map((c) => CATEGORY_LABEL[c]).join(", "),
              })}
            </p>
            <Link
              href={withLocale(lang, `/collections?season=${season}`)}
              className="group mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink hover:text-signal"
            >
              {h.viewLookbook}
              <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        );

        return (
          <section key={season} className="border-b border-stone-300 bg-white">
            <div className="grid grid-cols-1 sm:grid-cols-2">
              {imageOnRight ? (
                <>
                  {textPanel}
                  {imagePanel}
                </>
              ) : (
                <>
                  {imagePanel}
                  {textPanel}
                </>
              )}
            </div>
          </section>
        );
      })}

      {/* Built for operators */}
      <section className="border-y border-stone-300 bg-stone-100 py-20">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <h2 className="font-display max-w-lg text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            {h.operatorsHeading}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Feature title={h.feature1Title} body={h.feature1Body} />
            <Feature title={h.feature2Title} body={h.feature2Body} />
            <Feature title={h.feature3Title} body={h.feature3Body} />
            <Feature title={h.feature4Title} body={h.feature4Body} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">{h.ctaHeading}</h2>
            <p className="mt-1 text-sm text-stone-300/80">{h.ctaBody}</p>
          </div>
          <LinkButton href={withLocale(lang, "/apply")} size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            {h.ctaButton}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}

function QuickStep({
  n,
  title,
  body,
  href,
  cta,
}: {
  n: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="relative">
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -top-7 left-0 select-none text-6xl font-semibold leading-none text-stone-200 sm:-top-8 sm:text-7xl"
      >
        {n}
      </span>
      <div className="relative mt-10 sm:mt-12">
        <h3 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
        <Link
          href={href}
          className="group mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink hover:text-signal"
        >
          {cta}
          <span aria-hidden className="transition-transform duration-150 group-hover:translate-x-1">
            →
          </span>
        </Link>
      </div>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-ink pl-4">
      <h3 className="font-display text-sm font-bold uppercase tracking-tight text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
