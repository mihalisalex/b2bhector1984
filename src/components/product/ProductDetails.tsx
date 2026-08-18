import Link from "next/link";
import { getAvailableBoxTypes } from "@/lib/data/boxTypes";
import { CATEGORY_LABEL, GENDER_LABEL } from "@/lib/data/styleLabels";
import { formatEUR, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { SizeChart } from "@/components/product/SizeChart";
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
  minOrderPairs = MIN_ORDER_PAIRS,
  showPricing = true,
}: {
  style: Style;
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

  return (
    <div className="mt-8 border-t border-stone-300">
      <Section title="Description" defaultOpen>
        {/* Sanitized server-side on write (sanitizeProductDescription) to a fixed tag
            allowlist matching exactly what the admin rich-text editor can produce. */}
        <div
          className="prose max-w-none text-sm leading-relaxed text-ink-soft [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:uppercase [&_h2]:text-ink [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-signal [&_a]:underline"
          dangerouslySetInnerHTML={{ __html: style.description }}
        />
        {style.lastNote && (
          <p className="mt-4 border-l-2 border-court bg-court-100/60 px-3 py-2 text-sm text-ink-soft">
            <span className="font-semibold text-ink">Rep note — </span>
            {style.lastNote}
          </p>
        )}
      </Section>

      <Section title="Specifications">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Spec label="Style number" value={style.styleNumber} />
          <Spec label="Brand" value={style.brandName} />
          <Spec label="Category" value={`${CATEGORY_LABEL[style.category]} · ${GENDER_LABEL[style.gender]}`} />
          <Spec label="Materials" value={style.materials.join(", ")} />
          <Spec label="Weight" value={`${style.weightOz} oz per pair`} />
          {showPricing && <Spec label="MSRP" value={`${formatEUR(style.msrp)} — suggested retail`} />}
          <Spec label="Sold as" value={`${boxTypes.map((b) => b.totalPairs).join(" / ")}-pair pre-pack boxes`} />
          <Spec label="Size run" value="EU 40–45" />
          {hasDimensions && (
            <Spec
              label="Dimensions"
              value={[style.lengthCm, style.widthCm, style.heightCm].filter(Boolean).join(" × ") + " cm"}
            />
          )}
          {style.gtin && <Spec label="GTIN" value={style.gtin} />}
          {style.mpn && <Spec label="MPN" value={style.mpn} />}
          {attributes.map((attr) => (
            <Spec key={attr.id} label={attr.key} value={attr.value} />
          ))}
        </dl>
      </Section>

      <Section title="Size run &amp; box breakdown">
        <p className="mb-3 text-sm text-ink-soft">
          Every box is a fixed pre-pack — the size run below is what ships. Single pairs aren&rsquo;t sold wholesale.
        </p>
        <SizeChart style={style} />
      </Section>

      <Section title="Ordering, shipping &amp; returns">
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <Spec label="Order minimum" value={`${minOrderPairs} pairs, mixable across any styles`} />
          <Spec
            label="Availability"
            value={
              style.availability === "available"
                ? "Available now — ships from current stock"
                : `Pre-book${style.shipWindow ? ` — ships ${style.shipWindow}` : ""}`
            }
          />
          <Spec label="Payment terms" value="Prepay (10% off), Net 30 (5% off), or Net 60 at list" />
          <Spec label="Pricing shown" value={`Excludes VAT (${style.vatRate}%), applied at invoicing`} />
          {style.shippingClass && <Spec label="Shipping class" value={style.shippingClass} />}
        </dl>
        <p className="mt-4 text-sm text-ink-soft">
          Full shipping, returns and account terms are on the{" "}
          <Link href="/faq" className="text-signal underline hover:text-ink">
            FAQ
          </Link>
          . Your territory rep can confirm anything specific to your account.
        </p>
      </Section>

      <Section title="Downloads">
        <ul className="flex flex-col gap-2 text-sm">
          <li>
            <a
              href={`/api/styles/${style.id}/spec-sheet`}
              className="font-medium text-signal underline hover:text-ink"
            >
              Spec sheet (PDF)
            </a>
            <span className="ml-2 text-ink-soft">— pricing, size run, materials</span>
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
