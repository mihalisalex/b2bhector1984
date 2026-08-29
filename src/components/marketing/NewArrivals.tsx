import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { withLocale } from "@/i18n/paths";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { Style } from "@/lib/types";
import type { StyleImage } from "@/lib/data/styleImages";

/**
 * Curated homepage shelf: the styles an admin has ticked "New arrival" on the product
 * editor's Visibility tab (migration 0040).
 *
 * Renders NOTHING when nothing is flagged, rather than falling back to "the four newest
 * styles" or similar. A shelf the owner curates should be empty until they curate it —
 * silently auto-filling it would mean the homepage advertises arrivals nobody chose, and
 * the admin would have no way to tell the difference between "working" and "ignored".
 *
 * Reuses ProductCard so these tiles are the same object as the catalogue's, including the
 * withheld-price treatment for signed-out visitors. `inventory` is deliberately omitted,
 * which hides Quick Add: this is a marketing surface, and adding to cart belongs on the
 * catalogue and product pages where the buyer can see what they are committing to.
 */
export function NewArrivals({
  styles,
  imagesByStyle,
  showPricing,
  priceMultiplier,
  locale,
  dict,
}: {
  styles: Style[];
  imagesByStyle: Record<string, StyleImage[]>;
  showPricing: boolean;
  priceMultiplier: number;
  locale: Locale;
  dict: Dictionary;
}) {
  if (styles.length === 0) return null;
  const h = dict.home;

  return (
    <section className="border-b border-stone-300 bg-white py-16">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col gap-3 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">
              {h.newArrivalsEyebrow}
            </span>
            <h2 className="font-display mt-2 text-2xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-3xl">
              {h.newArrivalsHeading}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">{h.newArrivalsBody}</p>
          </div>
          <LinkButton href={withLocale(locale, "/catalogue")} size="sm" variant="secondary" className="shrink-0">
            {h.newArrivalsCta}
          </LinkButton>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {styles.map((style) => (
            <ProductCard
              key={style.id}
              style={style}
              showPricing={showPricing}
              priceMultiplier={priceMultiplier}
              images={imagesByStyle[style.id] ?? []}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Also used by the homepage to decide whether to fetch images at all. */
export function pickNewArrivals(styles: Style[], limit = 4): Style[] {
  return styles
    .filter((s) => s.newArrival)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
