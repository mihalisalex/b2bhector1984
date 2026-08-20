import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { TERMS_LABEL, MIN_ORDER_PAIRS } from "@/lib/pricing";
import { formatDate, telHref } from "@/lib/format";
import { cn } from "@/lib/cn";
import { isWhatsAppConfigured } from "@/lib/whatsapp";
import { ProfileForm } from "@/components/account/ProfileForm";
import { PasswordForm } from "@/components/account/PasswordForm";
import { ShipToManager } from "@/components/account/ShipToManager";
import { LinkButton } from "@/components/ui/Button";

export const metadata = { title: "Account", robots: { index: false, follow: false } };

export default async function AccountPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const d = (await getDictionary(lang as Locale)).dashboard;
  const account = await getCurrentAccount();
  if (!account) redirect("/login");

  return (
    <div className="mx-auto max-w-[1100px] px-6 py-8 lg:px-10">
      <div className="border-b border-stone-300 pb-6">
        <p className="text-xs text-ink-soft">
          <Link href="/dashboard" className="hover:text-ink">
            Dashboard
          </Link>{" "}
          / Account
        </p>
        <h1 className="font-display mt-1 text-2xl font-bold uppercase tracking-tight text-ink">{d.account}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {account.businessName} · manage your contact info, password, and shipping addresses.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border border-stone-300 bg-white p-5">
        <div>
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{d.wholesaleDashboard}</h2>
          <p className="mt-1 text-sm text-ink-soft">{d.dashboardIntro}</p>
        </div>
        <LinkButton href="/dashboard" variant="secondary" size="sm">
          Go to Dashboard
        </LinkButton>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="border border-stone-300 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.profile}</h2>
          <div className="mt-4">
            <ProfileForm account={account} whatsappEnabled={isWhatsAppConfigured()} />
          </div>
        </section>

        <section className="border border-stone-300 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.password}</h2>
          <div className="mt-4">
            <PasswordForm />
          </div>
        </section>
      </div>

      <section className="mt-6 border border-stone-300 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.shippingAddresses}</h2>
        <div className="mt-4">
          <ShipToManager addresses={account.shipTo} />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="border border-stone-300 bg-white p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{d.billingAndTerms}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Stat label={d.paymentTerms} value={TERMS_LABEL[account.creditTerms]} />
            <Stat label={d.minimumOrder} value={`${account.minOrderPairs ?? MIN_ORDER_PAIRS} pairs`} />
            <Stat label={d.resaleCert} value={account.resaleCertId} />
            <Stat label={d.businessType} value={account.businessType} />
            <Stat label={d.storeLocation} value={account.storeLocation} />
            <Stat label={d.applied} value={formatDate(account.appliedAt)} />
          </div>
          <p className="mt-4 border-t border-stone-200 pt-3 text-xs text-ink-soft">
            Payment terms, minimum order, and compliance fields are managed by your sales rep — contact them below to
            request a change.
          </p>
        </section>

        <section className="border border-stone-300 bg-ink p-5 text-stone-200">
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
            <a href={`mailto:${account.rep.email}`} className="hover:text-white">
              {account.rep.email}
            </a>
            {account.rep.phone && (
              <a href={telHref(account.rep.phone)} className="hover:text-white">
                {account.rep.phone}
              </a>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/** `isPrice` drops the monospace treatment — that font is for utilitarian ids/counts, not a currency figure. */
function Stat({ label, value, isPrice }: { label: string; value: string; isPrice?: boolean }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <div className={cn("mt-1 text-sm font-semibold tabular-nums text-ink", !isPrice && "font-mono-tab")}>
        {value}
      </div>
    </div>
  );
}
