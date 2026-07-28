import Image from "next/image";
import Link from "next/link";
import { getAllStyles, CATEGORY_LABEL, SEASON_LABEL } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import type { Category, Season } from "@/lib/types";
import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";
import { ScoreboardStrip } from "@/components/marketing/ScoreboardStrip";

const SEASON_CATEGORIES: Record<Season, Category[]> = {
  summer: ["loafers", "wedding", "sneakers", "sandals"],
  winter: ["boots", "sneakers", "formal", "anatomic"],
};

export default async function HomePage() {
  const [styles, hero] = await Promise.all([getAllStyles(), getHomepageHero()]);
  const headingLines = hero.heading.split("\n");

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-300 bg-ink">
        <Image
          src={hero.heroImageUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover grayscale"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(105deg, rgba(8,9,11,0.75) 0%, rgba(8,9,11,0.55) 32%, rgba(8,9,11,0.15) 60%, rgba(8,9,11,0.4) 100%)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" aria-hidden />

        <div className="relative mx-auto max-w-[1440px] px-6 py-16 lg:px-10 lg:py-28">
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
              <LinkButton href={hero.primaryCtaHref} size="lg">{hero.primaryCtaLabel}</LinkButton>
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
      <section className="border-b border-stone-300 bg-stone-100 py-10">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <p className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">
            New here? Ordering takes three steps.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <QuickStep n="1" title="Apply" body="Tell us about your store — takes 2 minutes." href="/apply" cta="Apply now" />
            <QuickStep n="2" title="Log in" body="Once approved, sign in to unlock pricing and MOQs." href="/login" cta="Buyer login" />
            <QuickStep n="3" title="Order" body="Browse Quick Order or the Catalogue and check out." href="/quick-order" cta="Quick Order" />
          </div>
        </div>
      </section>

      <ScoreboardStrip />

      {/* Category teaser */}
      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <div className="flex items-end justify-between border-b border-stone-300 pb-6">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
              The Collection
            </h2>
            <p className="mt-2 max-w-lg text-sm text-ink-soft">
              Two seasons, seven categories. Full pricing, MOQs, and matrix ordering unlock once
              your wholesale account is approved.
            </p>
          </div>
          <Link href="/collections" className="hidden text-sm font-medium text-signal hover:underline sm:block">
            View lookbook →
          </Link>
        </div>

        {(Object.keys(SEASON_CATEGORIES) as Season[]).map((season) => (
          <div key={season} className="mt-10 first:mt-8">
            <h3 className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">
              {SEASON_LABEL[season]}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {SEASON_CATEGORIES[season].map((cat) => {
                const rep = styles.find((s) => s.season === season && s.category === cat);
                if (!rep) return null;
                const count = styles.filter((s) => s.season === season && s.category === cat).length;
                return (
                  <Link
                    key={`${season}-${cat}`}
                    href={`/collections?season=${season}&category=${cat}`}
                    className="group block border border-stone-300 bg-white transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgba(26,29,34,0.12)]"
                  >
                    <div className="overflow-hidden">
                      <StylePlate
                        swatch={rep.colorways[0].swatch}
                        imageUrl={rep.primaryImageUrl}
                        className="aspect-[4/3] w-full transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold uppercase tracking-tight text-ink group-hover:underline">
                        {CATEGORY_LABEL[cat]}
                      </h3>
                      <p className="mt-1 text-xs text-ink-soft">{count} style{count > 1 ? "s" : ""} this season</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      {/* Built for operators */}
      <section className="border-y border-stone-300 bg-stone-100 py-20">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
          <h2 className="font-display max-w-lg text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            A storefront up front. An ordering engine underneath.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Feature
              title="Matrix Ordering"
              body="Build a full colorway × size-run order on one screen, with live MOQ and case-pack validation."
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

      {/* How it works */}
      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10">
        <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
          How wholesale access works
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-4">
          <Step n="01" title="Apply" body="Tell us about your store — resale certificate, volume, location." />
          <Step n="02" title="Review" body="Our team verifies your business, usually within 2 business days." />
          <Step n="03" title="Approved" body="Your account is provisioned with a tier, terms, and a rep." />
          <Step n="04" title="Order" body="Full catalog, linesheet, and matrix ordering unlock immediately." />
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              Ready to carry Hector 1984?
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
    <div className="border border-stone-300 bg-white p-5">
      <div className="flex items-center gap-3">
        <span className="font-mono-tab flex h-8 w-8 shrink-0 items-center justify-center bg-ink text-sm font-semibold text-white">
          {n}
        </span>
        <h3 className="font-display text-sm font-bold uppercase tracking-tight text-ink">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{body}</p>
      <Link href={href} className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-signal hover:underline">
        {cta} →
      </Link>
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

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <span className="font-mono-tab text-3xl font-bold text-stone-300">{n}</span>
      <h3 className="font-display mt-2 text-sm font-bold uppercase tracking-tight text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
    </div>
  );
}
