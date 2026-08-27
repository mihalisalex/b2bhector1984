import type { Metadata } from "next";
import { t } from "@/i18n/format";
import { withLocale } from "@/i18n/paths";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOrdersForAccount } from "@/lib/runtimeOrders";
import { getAssortmentsForAccount } from "@/lib/data/assortments";
import { formatEUR, summarizeOrder, TERMS_LABEL, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { formatDate, telHref } from "@/lib/format";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReorderButton } from "@/components/dashboard/ReorderButton";
import { LinkButton } from "@/components/ui/Button";
import { TextActionLink } from "@/components/ui/TextAction";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return { title: dict.dashboard.title, robots: { index: false, follow: false } };
}

export default async function DashboardPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const d = (await getDictionary(lang as Locale)).dashboard;
  const locale = lang as Locale;
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const orders = await getOrdersForAccount(account.id);
  const assortments = await getAssortmentsForAccount(account.id);
  const ytdTotal = orders.reduce((sum, o) => sum + summarizeOrder(o).grandTotal, 0);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-300 pb-6">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-ink">
            Welcome back, {account.contactName.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">{account.businessName} · {account.storeLocation}</p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/quick-order" variant="secondary" size="sm">{d.quickOrder}</LinkButton>
          <LinkButton href="/catalogue" size="sm">{d.browseCatalogue}</LinkButton>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="border border-stone-300 bg-white p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.account}</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label={d.termsShort} value={TERMS_LABEL[account.creditTerms]} />
            <Stat label={d.minimumOrder} value={t(d.pairsValue, { count: account.minOrderPairs ?? MIN_ORDER_PAIRS })} />
            <Stat label={d.ytdOrdered} value={formatEUR(ytdTotal, locale)} isPrice />
          </div>
          <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-ink-soft">
            Wholesale price is set by payment terms at checkout — pay in full for 10% off, net-30 for 5% off,
            or net-60 at list price.
          </p>
        </div>

        <div className="border border-stone-300 bg-ink p-5 text-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-300/70">{d.yourRep}</h2>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-mono-tab flex h-11 w-11 shrink-0 items-center justify-center bg-white text-sm font-semibold text-ink">
              {account.rep.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{account.rep.name}</p>
              <p className="truncate text-xs text-stone-300/70">{account.rep.title}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1 text-xs text-stone-300/80">
            <a href={`mailto:${account.rep.email}`} className="hover:text-white">{account.rep.email}</a>
            {account.rep.phone && (
              <a href={telHref(account.rep.phone)} className="hover:text-white">{account.rep.phone}</a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{d.orderHistory}</h2>
          </div>
          {orders.length === 0 ? (
            <div className="mt-3 border border-dashed border-stone-300 bg-stone-100 px-6 py-10 text-center text-sm text-ink-soft">
              {d.noOrdersYet}
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {orders.map((order) => {
                const { grandTotal, totalPairs } = summarizeOrder(order);
                const productionCount = order.lines.filter((l) => l.fulfillment === "production").length;
                return (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border border-stone-300 bg-white p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={withLocale(locale, `/dashboard/orders/${order.id}`)} className="font-mono-tab text-sm font-semibold text-ink hover:underline">
                          {order.id}
                        </Link>
                        <StatusBadge status={order.status} />
                        {productionCount > 0 && (
                          <span className="border border-court/50 bg-court-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink">
                            {t(d.inProduction, { count: productionCount })}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        {t(d.orderSummaryLine, { date: formatDate(order.placedAt, locale), pairs: totalPairs })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold tabular-nums text-ink">{formatEUR(grandTotal, locale)}</span>
                      <ReorderButton order={order} />
                      <TextActionLink href={withLocale(locale, `/dashboard/orders/${order.id}`)} tone="neutral">
                        {d.details}
                      </TextActionLink>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:w-72 lg:shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{d.savedAssortments}</h2>
          </div>
          {assortments.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">{d.noAssortments}</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {assortments.map((a) => (
                <Link key={a.id} href={withLocale(locale, "/dashboard/assortments")} className="block border border-stone-300 bg-white p-3 hover:border-ink">
                  <p className="text-sm font-medium text-ink">{a.name}</p>
                  <p className="text-xs text-ink-soft">{t(d.assortmentLine, { count: a.styleIds.length, date: formatDate(a.createdAt, locale) })}</p>
                </Link>
              ))}
            </div>
          )}
          <TextActionLink href={withLocale(locale, "/dashboard/assortments")} tone="accent" className="mt-3 inline-block">
            {d.viewAllAssortments}
          </TextActionLink>
        </div>
      </div>
    </div>
  );
}

/** `isPrice` drops the monospace treatment — that font is for utilitarian ids/counts, not a currency figure. */
function Stat({
  label,
  value,
  node,
  isPrice,
}: {
  label: string;
  value?: string;
  node?: React.ReactNode;
  isPrice?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <div className={cn("mt-1 text-sm font-semibold tabular-nums text-ink", !isPrice && "font-mono-tab")}>
        {node ?? value}
      </div>
    </div>
  );
}
