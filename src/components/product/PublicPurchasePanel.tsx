import Link from "next/link";
import { ColorwayPicker } from "@/components/product/ColorwayPicker";
import { useI18n } from "@/i18n/I18nProvider";
import { AvailabilityBadge } from "@/components/ui/Badge";
import type { Style } from "@/lib/types";
import type { StyleInventory } from "@/lib/data/inventory";

/**
 * What stands in for the buy box when nobody is signed in.
 *
 * The product page is public so search engines can index it, but trade pricing,
 * live stock and the box-matrix order form are for approved accounts. This panel
 * keeps the parts of the buy box that are genuinely product information — the
 * colourway swatches, which also drive the photo gallery, and the availability
 * badge — and replaces the pricing and ordering controls with the reason they
 * are missing and the two ways to resolve it.
 *
 * Deliberately a server component with no cart or catalog context: the
 * `(catalog)` layout mounts neither provider for anonymous visitors, and
 * `useCart`/`useCatalog` throw rather than degrade. Anything rendered here must
 * survive without them.
 */
export function PublicPurchasePanel({
  style,
  inventory,
  applyHref,
  loginHref,
}: {
  style: Style;
  inventory: StyleInventory;
  applyHref: string;
  loginHref: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <AvailabilityBadge style={style} />

      <ColorwayPicker style={style} inventory={inventory} />

      <div className="border border-stone-300 bg-white p-5">
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-soft">{useI18n().dict.wholesale.only}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">
          Trade pricing, box quantities and live stock are available to approved wholesale
          accounts. Applications are reviewed manually, usually within two business days.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href={applyHref}
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-white hover:bg-ink/85"
          >
            Apply for wholesale access
          </Link>
          <Link
            href={loginHref}
            className="text-xs font-semibold uppercase tracking-wide text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            Already approved? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
