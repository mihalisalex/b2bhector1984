import Link from "next/link";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { CATEGORY_LABEL, GENDER_LABEL } from "@/lib/data/styleLabels";
import { formatEUR, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { SizeChart } from "@/components/product/SizeChart";
import { localizeStyle } from "@/lib/localizeStyle";
import { vatPercent } from "@/lib/tax";
import { t } from "@/i18n/format";
import { withLocale } from "@/i18n/paths";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Style } from "@/lib/types";

/**
 * Everything below the buy box, as a set of native `<details>` sections.
 *
 * Deliberately zero-JS (no client component, no tab state): `<details>` gives
 * keyboard support, screen-reader semantics, and in-page find/Ctrl-F for free,
 * and this content is long-tail — most buyers only open one section, so paying
 * for hydration to render all of it eagerly would be backwards.
 */
export function ProductDetails({
  style,
  locale,
  dict,
  minOrderPairs = MIN_ORDER_PAIRS,
  showPricing = true,
}: {
  style: Style;
  locale: Locale;
  dict: Dictionary;
  minOrderPairs?: number;
  /** Set false for anonymous visitors. Withholds the MSRP row — suggested *retail* is
   * not the wholesale figure, but it is still a price, and "everything except pricing"
   * is the promise this page makes to a logged-out visitor. Everything else in the
   * specification list stays, so the page keeps real content for a crawler. */
  showPricing?: boolean;
}) {
  const boxTypes = getAvailableBoxTypes(style);
  const docs = style.documents ?? [];
  const attributes = style.attributes ?? [];
  const hasDimensions = style.lengthCm || style.widthCm || style.heightCm;
  const p = dict.product;
  // Greek prose where it has been written, English otherwise — the fallback is silent by
  // design and counted in the admin product list.
  const copy = localizeStyle(style, locale);

  return (
    <div className="mt-8 border-t border-stone-300">
      <Section title={p.description} defaultOpen>
        {/* Sanitized server-side on write (sanitizeProductDescription) to a fixed tag
            allowlist matching exactly what the admin rich-text editor can produce. */}
        <div
          className="prose max-w-none text-sm leading-relaxed text-ink-soft [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-ink [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-signal [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: copy.description }}
        />
        {copy.lastNote && (
          <p className="mt-4 border-l-2 border-court bg-court-100/60 px-3 py-2 text-sm text-ink-soft">
            <span className="font-semibold text-ink">{p.repNote} — </span>
            {copy.lastNote}
          </p>
        )}
      </Section>

      {/* Rendered only when the list has rows. English is empty for every style today, so
          an unconditional section would show an empty heading on every English page. */}
      {copy.features.length > 0 && (
        <Section title={p.features}>
          <ul className="list-disc pl-5 text-sm leading-relaxed text-ink-soft">
            {copy.features.map((feature) => (
              <li key={feature} className="mb-1">
                {feature}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={p.specifications}>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Spec label={p.styleNumber} value={style.styleNumber} />
          <Spec label={p.brand} value={style.brandName} />
          <Spec label={p.category} value={`${CATEGORY_LABEL[style.category]} · ${GENDER_LABEL[style.gender]}`} />
          <Spec label={p.materials} value={copy.materials.join(", ")} />
          <Spec label={p.weight} value={t(p.weightValue, { oz: style.weightOz })} />
          {showPricing && <Spec label={p.msrp} value={t(p.msrpValue, { price: formatEUR(style.msrp, locale) })} />}
          <Spec label={p.soldAs} value={t(p.soldAsValue, { sizes: boxTypes.map((b) => b.totalPairs).join(" / ") })} />
          <Spec label={p.sizeRunLabel} value={dict.sizeRun} />
          {hasDimensions && (
            <Spec
              label={p.dimensions}
              value={[style.lengthCm, style.widthCm, style.heightCm].filter(Boolean).join(" × ") + " cm"}
            />
          )}
          {style.gtin && <Spec label={p.gtin} value={style.gtin} />}
          {style.mpn && <Spec label={p.mpn} value={style.mpn} />}
          {attributes.map((attr) => (
            <Spec key={attr.id} label={attr.key} value={attr.value} />
          ))}
        </dl>
      </Section>

      <Section title={p.sizeRunAndBox}>
        <p className="mb-3 text-sm text-ink-soft">
          {dict.box.fixed} {dict.box.noSinglePairs}
        </p>
        <SizeChart style={style} />
      </Section>

      <Section title={p.orderingShippingReturns}>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Spec label={p.orderMinimum} value={t(p.orderMinimumValue, { pairs: minOrderPairs })} />
          <Spec
            label={p.availability}
            value={
              style.availability === "available"
                ? p.availableNowValue
                : style.shipWindow
                  ? t(p.prebookValueWithWindow, { window: style.shipWindow })
                  : p.prebookValue
            }
          />
          <Spec label={p.paymentTerms} value={dict.terms.discounts} />
          {/* `vatRate` is a fraction (0.24), so the old `${style.vatRate}%` rendered
              "Excludes VAT (0.24%)" on every product page. vatPercent does the conversion
              in the one place that owns it. */}
          <Spec label={p.pricingShown} value={t(p.pricingShownValue, { rate: vatPercent(style.vatRate) })} />
          {style.shippingClass && <Spec label={p.shippingClass} value={style.shippingClass} />}
        </dl>
        <p className="mt-4 text-sm text-ink-soft">
          {p.fullTermsPre}{" "}
          {/* Was a bare "/faq" — on /el this walked the reader out of Greek, the same
              defect the journal cards had. */}
          <Link href={withLocale(locale, "/faq")} className="text-signal underline hover:text-ink">
            {dict.nav.faq}
          </Link>
          {p.fullTermsPost}
        </p>
      </Section>

      <Section title={p.downloads}>
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <a
              href={`/api/styles/${style.id}/spec-sheet`}
              className="font-medium text-signal underline hover:text-ink"
            >
              {p.specSheet}
            </a>
            <span className="ml-2 text-ink-soft">— {p.specSheetDesc}</span>
          </li>
          {docs.map((doc) => (
            <li key={doc.id}>
              <a href={doc.publicUrl} className="font-medium text-signal underline hover:text-ink">
                {doc.label}
              </a>
              <span className="ml-2 text-ink-soft">— {doc.kind.replace(/_/g, " ")}</span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({
  title,
  defaultOpen,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group border-b border-stone-300">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold uppercase tracking-wide text-ink marker:hidden hover:text-signal [&::-webkit-details-marker]:hidden">
        {title}
        <span
          aria-hidden
          className="ml-4 shrink-0 text-lg font-normal leading-none text-ink-soft transition-transform group-open:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="pb-6">{children}</div>
    </details>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-stone-100 pb-2 last:border-b-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}
