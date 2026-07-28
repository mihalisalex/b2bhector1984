import { LinkButton } from "@/components/ui/Button";
import { StylePlate } from "@/components/product/StylePlate";

export const metadata = {
  title: "The Brand",
  description:
    "Hector 1984 has built full-grain leather footwear — loafers, boots, formal, and more, across a Summer and Winter collection — since the year we were founded, wholesale only.",
};

export default function BrandStoryPage() {
  return (
    <div>
      <section className="border-b border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Est. 1984</span>
          <h1 className="font-display mt-4 text-4xl font-bold uppercase leading-[1.02] tracking-tight text-ink sm:text-5xl">
            Built for the trials.
            <br />
            Built to last a season
            <br />
            of reorders.
          </h1>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1200px] grid-cols-1 gap-12 px-6 py-20 lg:grid-cols-2 lg:px-10">
        <div className="flex flex-col gap-6 text-sm leading-relaxed text-ink-soft">
          <p>
            Hector 1984 started in a shared shop space behind a downtown shoemaker, three weeks
            before that year&rsquo;s trade show. The first pair off the last was a hand-lasted
            loafer built for a local retailer who needed a shoe that could hold its shape on a
            shop-owner&rsquo;s budget — and it sold out of the store that carried it twice before
            the season ended.
          </p>
          <p>
            Four decades later, the construction standards haven&rsquo;t moved: full-grain leathers
            and suedes sourced from tanneries we&rsquo;ve worked with for over twenty years, and
            outsole compounds built for a floor, not a lookbook. What has changed is the range —
            a Summer collection (loafers, wedding, sneakers, sandals) and a Winter collection
            (boots, sneakers, formal, anatomic), each built on the same last philosophy and QC
            standard.
          </p>
          <p>
            We sell wholesale only, direct to independent and regional retailers who know their
            floor and their customer. No DTC discounting undercutting the accounts who carry us
            all year. That&rsquo;s the deal we&rsquo;ve kept since 1984.
          </p>
        </div>
        <StylePlate swatch={["#1a1d22", "#c1451e"]} styleNumber="HL-1001" className="aspect-square w-full" />
      </section>

      <section id="materials" className="border-t border-stone-300 bg-stone-100 px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-ink sm:text-3xl">
            Materials &amp; Craft
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <Material
              title="Full-grain leather & suede"
              body="Sourced from tanneries we've worked with for two decades. Consistent hand, consistent break-in, every case."
            />
            <Material
              title="Wedge-cupsole construction"
              body="The same midsole-to-outsole geometry from the original 1984 mold, updated with modern EVA and rubber compounds."
            />
            <Material
              title="Built to a QC standard, not a season"
              body="Every style passes the same flex, abrasion, and bond-strength testing before it ships to your floor."
            />
          </div>
        </div>
      </section>

      <section className="border-t border-stone-300 bg-ink py-16">
        <div className="mx-auto flex max-w-[1440px] flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center lg:px-10">
          <div>
            <h2 className="font-display text-2xl font-bold uppercase tracking-tight text-white">
              See the current collection
            </h2>
            <p className="mt-1 text-sm text-stone-300/80">Full pricing unlocks with an approved wholesale account.</p>
          </div>
          <LinkButton href="/collections" size="lg" className="!bg-white !text-ink hover:!bg-stone-200">
            View the Lookbook
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
