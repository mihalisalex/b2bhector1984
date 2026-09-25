import Image from "next/image";
import Link from "next/link";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import { whatsappHref } from "@/lib/contact";
import { STOCKISTS } from "@/lib/stockists";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";

/**
 * For first-time visitors: the whole process in five steps, the facts a buyer checks before
 * applying, and (once the owner supplies them) real shops that already stock the range.
 * Replaced the older three-step "apply / log in / order" strip. Server component.
 */
export function HowOrderingWorks({ dict, locale, leadTimeDays }: { dict: Dictionary; locale: Locale; leadTimeDays: number }) {
  const h = dict.home;
  const steps = [
    { title: h.howStep1Title, body: h.howStep1Body },
    { title: h.howStep2Title, body: h.howStep2Body },
    { title: h.howStep3Title, body: h.howStep3Body },
    { title: h.howStep4Title, body: h.howStep4Body },
    { title: h.howStep5Title, body: t(h.howStep5Body, { days: leadTimeDays }) },
  ];
  const facts = [h.factMinimum, h.factBoxes, t(h.factDelivery, { days: leadTimeDays }), h.factShipping, h.factPrepay];

  return (
    <section className="border-b border-stone-300 bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">{h.howEyebrow}</p>
        <h2 className="font-display mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{h.howHeading}</h2>

        {/* A real sequence, so the steps are numbered. */}
        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
          {steps.map((step, i) => (
            <li key={step.title} className="relative border-t-2 border-ink pt-4">
              <span className="font-mono-tab text-xs text-ink-soft">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-1 text-base font-semibold text-ink">{step.title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>

        <ul className="mt-10 flex flex-wrap gap-2">
          {facts.map((fact) => (
            <li key={fact} className="rounded-full border border-stone-300 bg-stone-50 px-3.5 py-1.5 text-xs font-medium text-ink">
              {fact}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={withLocale(locale, "/apply")}
            className="rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
          >
            {dict.nav.applyForAccess}
          </Link>
          <a
            href={whatsappHref(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-ink underline underline-offset-4 hover:text-signal"
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
