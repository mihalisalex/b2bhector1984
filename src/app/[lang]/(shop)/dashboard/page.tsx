import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOrdersForAccount } from "@/lib/runtimeOrders";
import { getAssortmentsForAccount } from "@/lib/data/assortments";
import { formatEUR, summarizeOrder, TERMS_LABEL } from "@/lib/pricing";
import { formatDate, telHref } from "@/lib/format";
import { cn } from "@/lib/cn";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReorderButton } from "@/components/dashboard/ReorderButton";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
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
          <LinkButton href="/quick-order" variant="secondary" size="sm">Quick Order</LinkButton>
          <LinkButton href="/catalogue" size="sm">Browse Catalogue</LinkButton>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="border border-stone-300 bg-white p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Account</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Terms" value={TERMS_LABEL[account.creditTerms]} />
            <Stat label="Credit limit" value={formatEUR(account.creditLimit)} isPrice />
            <Stat label="YTD ordered" value={formatEUR(ytdTotal)} isPrice />
          </div>
          <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-ink-soft">
            Wholesale price is set by payment terms at checkout — pay in full for 10% off, net-30 for 5% off,
            or net-60 at list price.
          </p>
        </div>

        <div className="border border-stone-300 bg-ink p-5 text-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-300/70">Your Rep</h2>
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
            <a href={telHref(account.rep.phone)} className="hover:text-white">{account.rep.phone}</a>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">Order History</h2>
          </div>
          {orders.length === 0 ? (
            <div className="mt-3 border border-dashed border-stone-300 bg-stone-100 px-6 py-10 text-center text-sm text-ink-soft">
              No orders yet. Start with Quick Order or the catalog.
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {orders.map((order) => {
                const { grandTotal, totalPairs } = summarizeOrder(order);
                return (
                  <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 border border-stone-300 bg-white p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/orders/${order.id}`} className="font-mono-tab text-sm font-semibold text-ink hover:underline">
                          {order.id}
                        </Link>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        {formatDate(order.placedAt)} · {totalPairs} pairs
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold tabular-nums text-ink">{formatEUR(grandTotal)}</span>
                      <ReorderButton order={order} />
                      <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-medium text-ink-soft hover:text-ink">
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:w-72 lg:shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">Saved Assortments</h2>
          </div>
          {assortments.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No saved assortments yet.</p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {assortments.map((a) => (
                <Link key={a.id} href="/dashboard/assortments" className="block border border-stone-300 bg-white p-3 hover:border-ink">
                  <p className="text-sm font-medium text-ink">{a.name}</p>
                  <p className="text-xs text-ink-soft">{a.styleIds.length} styles · saved {formatDate(a.createdAt)}</p>
                </Link>
              ))}
            </div>
          )}
          <Link href="/dashboard/assortments" className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-signal hover:underline">
            View all assortments
          </Link>
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
