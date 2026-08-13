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
      {/* Hero — redesigned 2026-08-11 (previously two same-weight buttons plus a third
          "view collection" link, all competing for the first click, with the explanatory
          sentence appearing *after* the buttons). One button, one quiet link, copy in the
          order eyebrow → headline → offer → action. Centered rather than left-aligned, with
          a symmetric top/bottom scrim instead of a one-sided diagonal one — centered text
          needs even contrast on both sides. Taller (`94vh` vs. the old 520-720px) so it
          actually commands the screen on load. */}
      <section className="relative isolate flex min-h-[94vh] items-center justify-center overflow-hidden border-b border-stone-300 bg-ink">
        {/* No dark overlay/scrim — removed on request (2026-08-11). object-bottom rather
            than the object-cover default (center): the product sits low in this frame
            (lower-third), and at this section's wide/short aspect ratio a center crop cuts
            the shoes out of frame entirely, leaving just the chair legs and floor.
            NOTE: this reopens two things the removed overlay was covering for — white
            text/button now has no guaranteed contrast against a bright stretch of photo,
            and the caption baked into the bottom of this photo ("SPRING/SUMMER 2027") is
            visible again on a narrow/tall viewport, where object-cover shows the image's
            full height with zero vertical crop margin (a fixed fact of this photo's
            landscape proportions, not a tunable crop setting). */}
        <Image src={hero.heroImageUrl} alt={h.heroImageAlt} fill priority sizes="100vw" className="object-cover object-[50%_60%]" />

        <div className="relative mx-auto max-w-2xl px-6 py-24 text-center [animation:hero-fade-up_900ms_cubic-bezier(0.16,1,0.3,1)_both] lg:px-10">
          <span className="inline-flex items-center gap-2 font-mono-tab text-xs uppercase tracking-[0.25em] text-stone-300/80">
            <span className="h-1 w-1 shrink-0 rounded-full bg-leather" aria-hidden />
            {displayEyebrow}
          </span>
          <h1 className="font-display mt-6 text-4xl font-bold uppercase leading-[1.02] text-white sm:text-6xl lg:text-7xl">
            {headingLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headingLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-stone-300/85">{displayBody}</p>
          <div className="mt-10 flex flex-col items-center gap-4">
            {/* ring-1 ring-white/20: a bare edge that doesn't depend on the backdrop for
                contrast — the button's own fill (bg-ink) is this site's --color-ink, the
                same near-black the bottom scrim is built from, so on a dark stretch of the
                photo the two could otherwise blend into each other with only the shadow
                left to separate them. */}
            <LinkButton
              href={withLocale(lang, hero.primaryCtaHref)}
              size="lg"
              className="px-10 shadow-[0_10px_36px_rgba(0,0,0,0.35)] ring-1 ring-white/20 transition-shadow hover:shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
            >
              {hero.primaryCtaLabel}
            </LinkButton>
            <Link
              href={withLocale(lang, hero.secondaryCtaHref)}
              className="text-xs font-medium uppercase tracking-[0.15em] text-stone-300/80 underline underline-offset-4 hover:text-white"
            >
              {hero.secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <span
          aria-hidden
          className="absolute inset-x-0 bottom-8 mx-auto w-fit font-mono-tab text-[10px] uppercase tracking-[0.3em] text-white/50"
        >
          Scroll
        </span>
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
