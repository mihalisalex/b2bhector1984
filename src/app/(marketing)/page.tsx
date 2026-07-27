import Link from "next/link";
import { STYLES, CATEGORY_LABEL } from "@/lib/data/styles";
import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";
import { ScoreboardStrip } from "@/components/marketing/ScoreboardStrip";

export default function HomePage() {
  const categories: Array<"running" | "court" | "trail"> = ["running", "court", "trail"];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-300 bg-ink">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-10 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div>
            <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-stone-300/70">
              Wholesale — Est. 1984
            </span>
            <h1 className="font-display mt-4 text-5xl font-bold uppercase leading-[0.95] tracking-tight text-white sm:text-6xl">
              Track-engineered
              <br />
              footwear for the
              <br />
              floor, not the feed.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-stone-300/80">
              Hector 1984 has sold into independent run shops, court specialty, and outdoor
              retailers since the year we were founded. Same construction standards. Same
              retailers who reorder every season.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/apply" size="lg">Apply for Wholesale Access</LinkButton>
              <LinkButton href="/collections" variant="secondary" size="lg" className="!border-white !text-white hover:!bg-white hover:!text-ink">
                View the Collection
              </LinkButton>
            </div>
          </div>
          <div className="relative hidden aspect-[4/3] lg:block">
            <StylePlate swatch={["#6b6560", "#e4e1d9"]} styleNumber="HR-1001" className="h-full w-full" />
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
              Three categories, one construction philosophy. Full pricing, MOQs, and matrix
              ordering unlock once your wholesale account is approved.
            </p>
          </div>
          <Link href="/collections" className="hidden text-sm font-medium text-signal hover:underline sm:block">
            View lookbook →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {categories.map((cat) => {
            const rep = STYLES.find((s) => s.category === cat)!;
            const count = STYLES.filter((s) => s.category === cat).length;
            return (
              <Link key={cat} href={`/collections?category=${cat}`} className="group block border border-stone-300 bg-white">
                <StylePlate swatch={rep.colorways[0].swatch} className="aspect-[4/3] w-full" />
                <div className="p-5">
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight text-ink group-hover:underline">
                    {CATEGORY_LABEL[cat]}
                  </h3>
                  <p className="mt-1 text-xs text-ink-soft">{count} styles this season</p>
                </div>
              </Link>
            );
          })}
        </div>
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
              title="Account-Specific Pricing"
              body="Standard, Preferred, and VIP tiers change your unit price and MOQ automatically — no calls to confirm."
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
