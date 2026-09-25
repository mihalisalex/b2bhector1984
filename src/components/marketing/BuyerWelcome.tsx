import Link from "next/link";
import { ReorderButton } from "@/components/dashboard/ReorderButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buttonClassNames } from "@/components/ui/Button";
import { formatDate, formatDayMonth } from "@/lib/format";
import { summarizeOrder, formatEUR } from "@/lib/pricing";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Locale } from "@/i18n/config";
import type { Account, Order } from "@/lib/types";

/**
 * The top of the homepage for a signed-in buyer, in place of the marketing hero they have
 * already seen: their last order with a one-click reorder, and the two fastest ways into an
 * order. Server component; ReorderButton is the only client island.
 */
export function BuyerWelcome({
  account,
  lastOrder,
  arrivalIso,
  locale,
  dict,
}: {
  account: Account;
  lastOrder?: Order;
  arrivalIso: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const h = dict.home;
  const summary = lastOrder ? summarizeOrder(lastOrder) : null;
  return (
    <section className="border-b border-stone-300 bg-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-6 py-10 lg:grid-cols-[1fr_minmax(0,28rem)] lg:px-10 lg:py-14">
        <div>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            {t(h.welcomeBack, { name: account.contactName.split(" ")[0] || account.businessName })}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
            {t(h.welcomeBody, { date: formatDayMonth(arrivalIso, locale) })}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={withLocale(locale, "/quick-order")} className={buttonClassNames("primary", "md")}>
              {h.openOrderSheet}
            </Link>
            <Link href={withLocale(locale, "/catalogue")} className={buttonClassNames("secondary", "md")}>
              {h.browseCatalogue}
            </Link>
          </div>
        </div>

        <div className="border border-stone-300 bg-stone-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{h.lastOrder}</p>
          {lastOrder && summary ? (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="font-mono-tab text-lg font-bold text-ink">{lastOrder.id}</span>
                <StatusBadge status={lastOrder.status} />
              </div>
              <p className="mt-1 text-sm tabular-nums text-ink-soft">
                {formatDate(lastOrder.placedAt, locale)} · {t(dict.catalog.pairsLabel, { count: summary.totalPairs })} · {formatEUR(summary.total, locale)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <ReorderButton order={lastOrder} className={buttonClassNames("primary", "sm")} />
                <Link href={withLocale(locale, `/dashboard/orders/${lastOrder.id}`)} className="text-sm text-ink underline hover:text-signal">
                  {h.viewOrder}
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-ink-soft">{h.noOrdersYetHome}</p>
          )}
        </div>
      </div>
    </section>
  );
}
