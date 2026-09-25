import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOrderById, getOrderStatusHistory } from "@/lib/runtimeOrders";
import { getStyleById } from "@/lib/data/styles";
import { getBoxType } from "@/lib/data/boxTypes";
import { formatEUR, summarizeOrder } from "@/lib/pricing";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buttonClassNames } from "@/components/ui/Button";
import { ReorderButton } from "@/components/dashboard/ReorderButton";
import { ClearCartOnMount } from "@/components/dashboard/ClearCartOnMount";
import { PrintButton } from "@/components/dashboard/PrintButton";
import { OrderJourney } from "@/components/order/OrderJourney";
import { getHomepageHero } from "@/lib/data/siteContent";
import { estimatedArrivalIso } from "@/lib/delivery";
import { getDictionary } from "@/i18n/getDictionary";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return { title: dict.orderDetail.title, robots: { index: false, follow: false } };
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; lang: string }>;
  searchParams: Promise<{ justPlaced?: string }>;
}) {
  const { id, lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  const o = dict.orderDetail;
  const { justPlaced } = await searchParams;
  const account = await getCurrentAccount();
  if (!account) redirect(withLocale(locale, "/login"));

  const order = await getOrderById(account.id, id);
  if (!order) notFound();

  const shipTo = account.shipTo.find((s) => s.id === order.shipToId);
  const statusHistory = await getOrderStatusHistory(order.id);
  const { total, vatTotal, grandTotal, totalBoxes, totalPairs } = summarizeOrder(order);

  const uniqueStyleIds = Array.from(new Set(order.lines.map((l) => l.styleId)));
  const styleEntries = await Promise.all(uniqueStyleIds.map(async (sid) => [sid, await getStyleById(sid)] as const));
  const styleById = new Map(styleEntries);
  // Every order is produced for the buyer; the estimate counts from confirmation once there
  // is one, otherwise from when the request was sent.
  const hero = await getHomepageHero();
  const confirmedAt = statusHistory.find((e) => e.status === "confirmed")?.changedAt;
  const arrivalIso = estimatedArrivalIso(hero.productionLeadTimeDays, new Date(confirmedAt ?? order.placedAt));
  const termsLabel = { prepay: dict.checkout.termsPrepay, net30: dict.checkout.termsNet30, net60: dict.checkout.termsNet60 }[order.terms];

  return (
    <div className="mx-auto max-w-[1000px] px-6 py-8 lg:px-10">
      {justPlaced === "1" && <ClearCartOnMount />}

      <nav className="mb-6 text-xs text-ink-soft print:hidden">
        <Link href={withLocale(locale, "/dashboard")} className="hover:text-ink">{o.dashboard}</Link> / {order.id}
      </nav>

      {justPlaced === "1" && (
        <div className="mb-6 border border-positive/40 bg-positive-100 px-4 py-3 text-sm text-positive print:hidden">
          {t(o.proformaNotice, { rep: account.rep.name })}
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-300 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono-tab text-2xl font-bold text-ink">{order.id}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">{t(o.placedOn, { date: formatDate(order.placedAt, locale) })}</p>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          <ReorderButton order={order} className={buttonClassNames("secondary", "sm")} />
          <a href={`/api/orders/${order.id}/invoice`} className={buttonClassNames("secondary", "sm")}>
            {o.downloadInvoice}
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Detail label={o.shipTo}>
          {shipTo ? (
            <>
              {shipTo.label}<br />{shipTo.line1}<br />{shipTo.city}, {shipTo.state} {shipTo.zip}
            </>
          ) : "—"}
        </Detail>
        <Detail label={o.terms}>{termsLabel ?? order.terms}</Detail>
        <Detail label={o.tracking}>
          {order.trackingNumber ? `${order.carrier ?? ""} ${order.trackingNumber}`.trim() : "—"}
        </Detail>
        <Detail label={o.notes}>{order.notes ?? "—"}</Detail>
      </div>

      {/* Where the order is in the real process, with dates as they happen — replaces the
          bare list of status changes (which also rendered in English on every language). */}
      <div className="mt-8 border border-stone-300 bg-white p-5 print:hidden">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{dict.dashboard.journeyTitle}</h2>
        <OrderJourney
          className="mt-5"
          dict={dict.dashboard}
          locale={locale}
          leadTimeDays={hero.productionLeadTimeDays}
          arrivalIso={arrivalIso}
          status={order.status}
          events={statusHistory}
        />
      </div>

      <div className="mt-8 scroll-thin overflow-x-auto border border-stone-300">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-300 bg-stone-100 text-left text-[11px] uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-2.5">{o.thStyle}</th>
              <th className="px-3 py-2.5">{o.thColorway}</th>
              <th className="px-3 py-2.5">{o.thBox}</th>
              <th className="px-3 py-2.5 text-right">{o.thQty}</th>
              <th className="px-3 py-2.5 text-right">{o.thUnit}</th>
              <th className="px-4 py-2.5 text-right">{o.thTotal}</th>
              <th className="px-3 py-2.5">{o.thStatus}</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line, i) => {
              const style = styleById.get(line.styleId);
              const colorway = style?.colorways.find((c) => c.id === line.colorwayId);
              const box = getBoxType(line.boxTypeId);
              const lineTotal = line.qty * box.totalPairs * line.unitPrice;
              return (
                <tr key={i} className="border-b border-stone-200 last:border-b-0">
                  <td className="px-4 py-2 text-ink">{style?.name ?? line.styleId}</td>
                  <td className="px-3 py-2 text-ink-soft">{colorway?.name ?? line.colorwayId}</td>
                  <td className="font-mono-tab px-3 py-2 text-ink-soft">{box.label}</td>
                  <td className="font-mono-tab px-3 py-2 text-right tabular-nums text-ink">{line.qty}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{formatEUR(line.unitPrice, locale)}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-ink">
                    {formatEUR(lineTotal, locale)}
                  </td>
                  <td className="px-3 py-2">
                    {line.fulfillment === "production" ? (
                      <span className="whitespace-nowrap text-xs font-medium text-ink">
                        {line.productionEta ? t(o.productionEta, { date: formatDate(line.productionEta, locale) }) : o.production}
                      </span>
                    ) : (
                      <span className="text-xs text-ink-soft">{o.inStock}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-ink bg-stone-50">
              <td
                colSpan={3}
                rowSpan={vatTotal > 0 ? 3 : 2}
                className="px-4 py-3 align-top text-xs font-semibold uppercase tracking-wide text-ink-soft"
              >
                {t(o.boxesPairs, { boxes: totalBoxes, pairs: totalPairs })}
              </td>
              <td colSpan={2} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-ink-soft">
                {o.subtotal}
              </td>
              <td className="px-4 py-2 text-right text-sm tabular-nums text-ink-soft">{formatEUR(total, locale)}</td>
            </tr>
            {vatTotal > 0 && (
              <tr className="bg-stone-50">
                <td colSpan={2} className="px-3 py-2 text-right text-xs uppercase tracking-wide text-ink-soft">
                  {o.vat}
                </td>
                <td className="px-4 py-2 text-right text-sm tabular-nums text-ink-soft">{formatEUR(vatTotal, locale)}</td>
              </tr>
            )}
            <tr className="bg-stone-50">
              <td colSpan={2} className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-ink-soft">
                {o.orderTotal}
              </td>
              <td className="px-4 py-3 text-right text-base font-semibold tabular-nums text-ink">
                {formatEUR(grandTotal, locale)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{children}</p>
    </div>
  );
}
