import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";
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
    <section className="reveal bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{h.newArrivalsEyebrow}</p>
            <h2 className="font-display mt-4 text-4xl leading-[1.1] text-ink sm:text-5xl">{h.newArrivalsHeading}</h2>
          </div>
          <Link
            href={withLocale(locale, "/catalogue")}
            className="shrink-0 text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-ink/30 underline-offset-[6px] transition-colors duration-300 hover:decoration-ink"
          >
            {h.newArrivalsCta}
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
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
