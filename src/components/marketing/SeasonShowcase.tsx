"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/cn";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { Style } from "@/lib/types";
import type { StyleImage } from "@/lib/data/styleImages";


/**
 * The homepage's season section: a toggle, three products, and a fourth cell that leads
 * into that season on /collections.
 *
 * Replaces the two full-width editorial rows this page used to carry. The toggle markup is
 * lifted verbatim from CollectionsExplorer — same pill, same sliding indicator, same
 * `px-3 sm:px-5` padding that keeps two season names inside a 375px viewport — so the
 * homepage and /collections read as the same control rather than two similar ones.
 *
 * Four cells at every breakpoint, which is what makes the 2-up mobile grid land as
 * "two products, then one product and the way in": three real styles and one door.
 */
export function SeasonShowcase({
  seasonOptions,
  stylesBySeason,
  countsBySeason,
  imagesByStyle,
  showPricing,
  priceMultiplier,
  locale,
  dict,
}: {
  seasonOptions: { value: string; label: string }[];
  /** Already trimmed to `PER_SEASON` by the server — the page knows which images to fetch. */
  stylesBySeason: Record<string, Style[]>;
  /** Full season size, for the "see all N" label. Not `stylesBySeason[x].length`, which is 3. */
  countsBySeason: Record<string, number>;
  imagesByStyle: Record<string, StyleImage[]>;
  showPricing: boolean;
  priceMultiplier: number;
  locale: Locale;
  dict: Dictionary;
}) {
  const [season, setSeason] = useState(seasonOptions[0]?.value ?? "");
  const h = dict.home;
  const seasonIndex = Math.max(0, seasonOptions.findIndex((o) => o.value === season));
  const shown = stylesBySeason[season] ?? [];
  if (seasonOptions.length === 0) return null;

  return (
    <section className="border-b border-stone-300 bg-white py-16">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex flex-col gap-4 border-b border-stone-300 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">
              {h.currentDrop}
            </span>
            <h2 className="font-display mt-2 text-2xl font-bold uppercase leading-[1.05] tracking-tight text-ink sm:text-3xl">
              {h.seasonShowcaseHeading}
            </h2>
          </div>

          {seasonOptions.length > 1 && (
            <div
              role="tablist"
              aria-label={h.seasonShowcaseHeading}
              className="relative grid shrink-0 self-start rounded-full border border-stone-300 bg-white p-0.5 sm:self-auto"
              style={{ gridTemplateColumns: `repeat(${seasonOptions.length}, minmax(0, 1fr))` }}
            >
              <div
                aria-hidden
                className="absolute inset-y-0.5 left-0.5 rounded-full bg-ink transition-transform duration-300 ease-out"
                style={{
                  width: `calc(${100 / seasonOptions.length}% - 4px)`,
                  transform: `translateX(calc(${seasonIndex} * (100% + 4px)))`,
                }}
              />
              {seasonOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="tab"
                  aria-selected={season === opt.value}
                  onClick={() => setSeason(opt.value)}
                  className={cn(
                    "relative z-10 whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-300 sm:px-5",
                    season === opt.value ? "text-white" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 sm:gap-y-10 lg:grid-cols-4">
          {shown.map((style) => (
            <ProductCard
              key={style.id}
              style={style}
              showPricing={showPricing}
              priceMultiplier={priceMultiplier}
              images={imagesByStyle[style.id] ?? []}
            />
          ))}

          {/* The fourth cell. Deliberately shaped like a card rather than dropped below the
              grid as a text link: on mobile it completes the second row, so the section
              reads as a full block instead of trailing off after an odd number of tiles. */}
          <Link
            href={withLocale(locale, `/collections?season=${season}`)}
            className="group flex flex-col"
          >
            <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 border border-ink bg-ink px-4 text-center transition-colors duration-300 group-hover:bg-ink/90">
              <span className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-white sm:text-xl">
                {h.seeAllSeason}
              </span>
              <span
                aria-hidden
                className="text-2xl text-white transition-transform duration-200 group-hover:translate-x-1"
              >
                →
              </span>
            </div>
            <p className="mt-3 text-[11px] uppercase tracking-wide text-ink-soft">
              {t(h.seasonStyleCount, { count: countsBySeason[season] ?? 0 })}
            </p>
          </Link>
        </div>
      </div>
    </section>
  );
}

