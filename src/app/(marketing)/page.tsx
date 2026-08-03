import Image from "next/image";
import Link from "next/link";
import { getStorefrontStyles, CATEGORY_LABEL, getStyleImageUrl } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { getSeasonSettings, toSeasonOptions } from "@/lib/data/seasonSettings";
import type { Category, Season } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";
import { pageMetadata } from "@/lib/seo";

/** Title/description match the root layout's defaults; declared here so the homepage
 * gets its own canonical and a self-referencing og:url like every other indexed page. */
export function generateMetadata() {
  return pageMetadata({
    title: "Hector Footwear — Wholesale",
    description:
      "Full-grain leather footwear, wholesaled the way serious retailers expect. Apply for a Hector Footwear wholesale account — matrix ordering, terms-based pricing, net terms.",
    path: "/",
  });
}

const SEASON_CATEGORIES: Record<Season, Category[]> = {
  summer: ["loafers", "wedding", "sneakers", "sandals"],
  winter: ["boots", "sneakers", "formal", "anatomic"],
};

export default async function HomePage() {
  const [styles, hero, seasonSettings] = await Promise.all([getStorefrontStyles(), getHomepageHero(), getSeasonSettings()]);
  const seasonOptions = toSeasonOptions(seasonSettings);
  const headingLines = hero.heading.split("\n");

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
          alt=""
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
          <div className="max-w-xl">
            <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-stone-300/70">
              {hero.eyebrow}
            </span>
            <h1 className="font-display mt-3 text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl">
              {headingLines.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < headingLines.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href={hero.primaryCtaHref} size="lg">
                {hero.primaryCtaLabel}
              </LinkButton>
              <LinkButton href={hero.secondaryCtaHref} variant="secondary" size="lg" className="!border-white !text-white hover:!bg-white hover:!text-ink">
                {hero.secondaryCtaLabel}
              </LinkButton>
            </div>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-stone-300/80">
              {hero.body}
            </p>
            <Link href="/collections" className="mt-3 inline-block text-sm font-medium text-stone-300 underline underline-offset-2 hover:text-white">
              View the collection first →
            </Link>
          </div>
        </div>
      </section>

      {/* Easy steps to order, right up top for first-time buyers */}
      <section className="border-b border-stone-300 bg-white py-16">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-10">
            <QuickStep n="01" title="Apply" body="Tell us about your store — takes 2 minutes." href="/apply" cta="Apply now" />
            <QuickStep n="02" title="Log in" body="Once approved, sign in to unlock full wholesale pricing." href="/login" cta="Buyer login" />
            <QuickStep n="03" title="Order" body="Browse Quick Order or the Catalogue and check out." href="/quick-order" cta="Quick Order" />
          </div>
        </div>
      </section>

      {/* Season spotlight — one full-width editorial row per enabled season, alternating
          text/image sides, instead of a 2-up grid that left a dead cell whenever a season
          had no styles yet (see the homepage redesign discussion for why). */}
      {seasonOptions.map(({ value: season, label }, index) => {
        const seasonStyles = styles.filter((s) => s.season === season);
        const rep = seasonStyles[0];
        if (!rep) return null;
        const imageUrl = seasonSettings[season].teaserImageUrl || getStyleImageUrl(rep);
        const imageOnRight = index % 2 === 0;

        const imagePanel = (
          <Link
            href={`/collections?season=${season}`}
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
              {index === 0 ? "The current drop" : "Also available"}
            </span>
            <h2 className="font-display mt-3 text-2xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-3xl">
              {label}
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
              {seasonStyles.length} styles · {SEASON_CATEGORIES[season].map((c) => CATEGORY_LABEL[c]).join(", ")}. Full
              pricing and matrix ordering unlock once your wholesale account is approved.
            </p>
            <Link
              href={`/collections?season=${season}`}
              className="group mt-5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-ink hover:text-signal"
            >
              View lookbook
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
            A storefront up front. An ordering engine underneath.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              title="Matrix Ordering"
              body="Build a full colorway × size-run order on one screen, with live case-pack validation."
            />
            <Feature
              title="Terms-Based Pricing"
              body="Pay in full for 10% off, net-30 for 5% off, or net-60 at list price — the same simple rule for every account."
            />
            <Feature
              title="Pre-Book & At-Once"
              body="Every style is tagged with its delivery window, so you always know what ships now versus next season."
            />
            <Feature
              title="Net Terms, Real Reps"
              body="Request net-30 or net-60 at checkout and reach your territory rep directly from your dashboard."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              Ready to carry Hector Footwear?
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">Applications reviewed by a real person, not a bot.</p>
          </div>
          <LinkButton href="/apply" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            Apply for Wholesale Access
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
        className="font-display pointer-events-none absolute -top-8 left-0 select-none text-7xl font-extrabold leading-none text-stone-200 sm:-top-9 sm:text-8xl"
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
