import Link from "next/link";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { Style } from "@/lib/types";
import { cn } from "@/lib/cn";

/**
 * "Also in: Brown · Black" on a product page — each colour of a model is its own product, so
 * these are links to the sibling pages rather than an in-page switch. Renders nothing for a
 * model that only comes in one colour. Server component.
 */
export function ModelColours({
  current,
  siblings,
  locale,
  dict,
}: {
  current: Style;
  siblings: Style[];
  locale: Locale;
  dict: Dictionary;
}) {
  if (siblings.length < 2) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-ink-soft">
        {t(dict.catalog.modelColours, { count: siblings.length })}
      </p>
      <ul className="flex flex-wrap gap-2">
        {siblings.map((s) => {
          const colorway = s.colorways[0];
          const active = s.id === current.id;
          // Only the upper's colour: the second swatch is usually the grey sole, which made a
          // split dot read as two colours.
          const [upper] = colorway.swatch;
          return (
            <li key={s.id}>
              <Link
                href={withLocale(locale, `/product/${s.slug}`)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs font-medium transition-colors",
                  active ? "border-ink bg-ink text-white" : "border-stone-300 bg-white text-ink hover:border-ink",
                )}
              >
                <span
                  aria-hidden
                  className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                  style={{ background: upper }}
                />
                <span className="capitalize">{colorway.name.toLowerCase()}</span>
                <span className={cn("font-mono-tab text-[10px]", active ? "text-white/70" : "text-ink-soft")}>{s.styleNumber}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
