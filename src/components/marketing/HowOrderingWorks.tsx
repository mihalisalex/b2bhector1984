import Image from "next/image";
import { LinkButton } from "@/components/ui/Button";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import { whatsappHref } from "@/lib/contact";
import { STOCKISTS } from "@/lib/stockists";
import { formatEUR } from "@/lib/pricing";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";

/**
 * For first-time visitors: the whole process in five steps, the facts a buyer checks before
 * applying, and (once the owner supplies them) real shops that already stock the range.
 * Replaced the older three-step "apply / log in / order" strip. Server component.
 */
export function HowOrderingWorks({
  dict,
  locale,
  leadTimeDays,
  fromPrice,
}: {
  dict: Dictionary;
  locale: Locale;
  leadTimeDays: number;
  /** The cheapest real pair price (prepay), from `lowestPairPrice`. */
  fromPrice?: number;
}) {
  const h = dict.home;
  const steps = [
    { title: h.howStep1Title, body: h.howStep1Body },
    { title: h.howStep2Title, body: h.howStep2Body },
    { title: h.howStep3Title, body: h.howStep3Body },
    { title: h.howStep4Title, body: h.howStep4Body },
    { title: h.howStep5Title, body: t(h.howStep5Body, { days: leadTimeDays }) },
  ];
  const facts = [
    fromPrice !== undefined ? t(h.factFromPrice, { price: formatEUR(fromPrice, locale) }) : "",
    h.factMinimum,
    h.factBoxes,
    t(h.factDelivery, { days: leadTimeDays }),
    h.factShipping,
    h.factPrepay,
  ].filter(Boolean);

  return (
    <section className="reveal bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <p className="text-[11px] uppercase tracking-[0.24em] text-ink-soft">{h.howEyebrow}</p>
        <h2 className="font-display mt-4 text-4xl leading-[1.1] text-ink sm:text-5xl">{h.howHeading}</h2>

        {/* A real sequence, so the steps are numbered. */}
        <ol className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-8">
          {steps.map((step, i) => (
            <li key={step.title} className="border-t border-stone-300 pt-5">
              <span className="text-xs tabular-nums text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
              <p className="font-display mt-3 text-xl text-ink">{step.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>

        <ul className="mt-16 grid grid-cols-1 gap-x-8 gap-y-3 text-sm text-ink sm:grid-cols-2 lg:grid-cols-3">
          {facts.map((fact) => (
            <li key={fact} className="border-b border-stone-200 pb-3">
              {fact}
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <LinkButton href={withLocale(locale, "/apply")} size="lg">
            {dict.nav.applyForAccess}
          </LinkButton>
          <a
            href={whatsappHref(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-ink underline decoration-ink/30 underline-offset-[6px] transition-colors duration-300 hover:decoration-ink"
          >
            {h.howAsk}
          </a>
        </div>

        {STOCKISTS.length > 0 && (
          <div className="mt-14 border-t border-stone-200 pt-8">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{h.stockistsHeading}</h3>
            <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {STOCKISTS.map((shop) => (
                <li key={`${shop.name}-${shop.town}`} className="grid gap-2">
                  {shop.imageUrl && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                      <Image src={shop.imageUrl} alt={`${shop.name}, ${shop.town}`} fill sizes="240px" className="object-cover" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-ink">{shop.name}</p>
                  <p className="-mt-2 text-xs text-ink-soft">{shop.town}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
