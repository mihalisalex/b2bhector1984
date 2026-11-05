import Link from "next/link";
import { withLocale } from "@/i18n/paths";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";

/** Who makes these shoes: the part of the homepage that is about the brand, not the process. */
export function BrandStory({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const h = dict.home;
  const stats = [
    { value: "1984", label: h.storyStatYear },
    { value: "80+", label: h.storyStatShops },
    { value: "100%", label: h.storyStatLeather },
  ];
  return (
    <section className="reveal bg-stone-100 py-24 lg:py-32">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-6 lg:grid-cols-2 lg:gap-20 lg:px-10">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{h.storyEyebrow}</p>
          <h2 className="font-display mt-5 text-4xl leading-[1.1] text-ink sm:text-5xl">{h.storyHeading}</h2>
        </div>
        <div className="lg:pt-9">
          <p className="max-w-lg text-lg leading-relaxed text-ink-soft">{h.storyBody}</p>
          <Link
            href={withLocale(locale, "/brand-story")}
            className="mt-7 inline-block text-xs font-medium uppercase tracking-[0.14em] text-ink underline decoration-ink/30 underline-offset-[6px] transition-colors duration-300 hover:decoration-ink"
          >
            {h.storyLink}
          </Link>
          <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-stone-300 pt-8">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="font-display text-3xl text-ink sm:text-4xl">{stat.value}</dd>
                <dt className="mt-2 text-xs leading-snug text-ink-soft">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
