import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getOrdersForAccount } from "@/lib/runtimeOrders";
import { getAssortmentsForAccount } from "@/lib/data/assortments";
import { getTier } from "@/lib/data/pricingTiers";
import { formatUSD, summarizeOrder } from "@/lib/pricing";
import { formatDate, telHref } from "@/lib/format";
import { TierBadge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ReorderButton } from "@/components/dashboard/ReorderButton";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Dashboard", robots: { index: false, follow: false } };

const TERMS_LABEL: Record<string, string> = { prepay: "Prepay", net30: "Net 30", net60: "Net 60" };

export default async function DashboardPage() {
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  const orders = await getOrdersForAccount(account.id);
  const assortments = getAssortmentsForAccount(account.id);
  const tier = getTier(account.tier);
  const ytdTotal = orders.reduce((sum, o) => sum + summarizeOrder(o).total, 0);

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
          <LinkButton href="/catalog" size="sm">Browse Catalog</LinkButton>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="border border-stone-300 bg-white p-5 lg:col-span-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Account</h2>
          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Tier" node={<TierBadge tier={account.tier} />} />
            <Stat label="Terms" value={TERMS_LABEL[account.creditTerms]} />
            <Stat label="Credit limit" value={formatUSD(account.creditLimit)} />
            <Stat label="YTD ordered" value={formatUSD(ytdTotal)} />
          </div>
          <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-ink-soft">
            {tier.description} Your tier discounts unit price {Math.round((1 - tier.priceMultiplier) * 100)}%
            and reduces minimum order quantities by {Math.round((1 - tier.moqMultiplier) * 100)}% versus standard.
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
                const { total, totalPairs } = summarizeOrder(order);
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
                        PO {order.poNumber} · {formatDate(order.placedAt)} · {totalPairs} pairs
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-mono-tab text-sm font-semibold text-ink">{formatUSD(total)}</span>
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
                  <p className="text-xs text-ink-soft">{a.styleIds.length} styles · saved {a.createdAt}</p>
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

function Stat({ label, value, node }: { label: string; value?: string; node?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <div className="font-mono-tab mt-1 text-sm font-semibold text-ink">{node ?? value}</div>
    </div>
  );
}
