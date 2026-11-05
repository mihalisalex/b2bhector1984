import Image from "next/image";
import Link from "next/link";
import { getStorefrontStyles } from "@/lib/data/styles";
import { getHomepageHero } from "@/lib/data/siteContent";
import { getOrderPulse } from "@/lib/data/orderPulse";
import { OrderPulse } from "@/components/marketing/OrderPulse";
import { NewArrivals, pickNewArrivals } from "@/components/marketing/NewArrivals";
import { listImagesForStyles } from "@/lib/data/styleImages";
import { getAccountForAudience } from "@/lib/session";
import { BuyerWelcome } from "@/components/marketing/BuyerWelcome";
import { HowOrderingWorks } from "@/components/marketing/HowOrderingWorks";
import { BrandStory } from "@/components/marketing/BrandStory";
import { lowestPairPrice } from "@/lib/pricing";
import { getOrdersForAccount } from "@/lib/runtimeOrders";
import { estimatedArrivalIso } from "@/lib/delivery";
import { LinkButton } from "@/components/ui/Button";
import { pageMetadata } from "@/lib/seo";
import { getDictionary } from "@/i18n/getDictionary";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

/** Declared here (not inherited from the root layout's defaults) so the homepage gets its
 * own canonical, hreflang set, and a self-referencing og:url like every other indexed page.
 * Locale-aware since 2026-08-09 — title/description now come from each locale's own
 * `dict.seo` copy instead of a single hardcoded English string reused under every prefix. */
export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const dict = await getDictionary(locale);
  return pageMetadata({
    title: dict.seo.homeTitle,
    description: dict.seo.homeDescription,
    path: "/",
    locale,
  });
}


export default async function HomePage({ params }: { params: Promise<{ lang: string; audience?: string }> }) {
  const { lang: rawLang, audience } = await params;
  const lang = rawLang as Locale;
  const [styles, hero, dict, pulse, account] = await Promise.all([
    getStorefrontStyles(),
    getHomepageHero(),
    getDictionary(lang),
    getOrderPulse(),
    getAccountForAudience(audience),
  ]);
  // Curated shelf (migration 0040). Only the flagged styles need their photos, so the
  // image lookup is scoped to them rather than the whole catalogue.
  const newArrivals = pickNewArrivals(styles);
  // Signed in: the welcome block replaces the marketing hero (see BuyerWelcome).
  const lastOrder = account ? (await getOrdersForAccount(account.id))[0] : undefined;
  const arrivalIso = estimatedArrivalIso(hero.productionLeadTimeDays);
  const newArrivalImages = newArrivals.length > 0 ? await listImagesForStyles(newArrivals.map((s) => s.id)) : {};


  const h = dict.home;
  // Hero copy, in precedence order.
  //
  // English uses the admin's live DB row, exactly as it always has. Greek now has its own
  // admin-editable row too (migration 0037's _el columns, edited side by side at
  // /admin/content) and that wins when written. Until it is written — and for de/fr, which
  // have no _el columns and no plans for any — the dictionary's hero copy stands in.
  //
  // Note what this deliberately never does: fall back to the ENGLISH database row on a
  // non-English page. That was the old failure this whole project exists to stop, and the
  // dictionary rung guarantees there is always a translated string to reach instead.
  // PREMIUM_COPY: the new brand copy lives in the dictionary while this redesign is reviewed,
  // because the database row is shared with the live site. Once approved, the copy goes into
  // the row and this returns to reading the admin's fields.
  const heroEl = lang === "el";
  const displayEyebrow = h.heroEyebrow;
  const displayHeadingRaw = h.heroHeading;
  const displayBody = h.heroBody;
  /**
   * CTA labels are resolved from the button's own DESTINATION, not from a fixed dictionary
   * key per slot.
   *
   * The two hrefs are admin-editable and currently point primary -> /collections and
   * secondary -> /apply, which is the reverse of what "primary = apply" would assume. A
   * first pass at this did assume it, and every non-English locale ended up labelling the
   * buttons backwards: a Greek buyer clicking «Αίτηση πρόσβασης» landed on the collections
   * page. Keying off the href means the admin can swap, reorder or repoint the buttons
   * from /admin/content and the translated labels follow instead of silently lying.
   *
   * An unrecognised destination falls back to the admin's own English label — a real label
   * pointing at the right place beats a translated one pointing at the wrong place.
   */
  const ctaLabel = (href: string, dbLabel: string, elOverride: string): string => {
    if (lang === "en") return dbLabel;
    if (heroEl && elOverride) return elOverride;
    if (href.includes("/apply")) return dict.nav.applyForAccess;
    if (href.includes("/collections")) return dict.nav.collections;
    if (href.includes("/catalogue")) return dict.nav.catalogue;
    if (href.includes("/quick-order")) return dict.nav.quickOrder;
    return dbLabel;
  };
  const displayPrimaryCta = ctaLabel(hero.primaryCtaHref, hero.primaryCtaLabel, hero.primaryCtaLabelEl);
  const displaySecondaryCta = ctaLabel(hero.secondaryCtaHref, hero.secondaryCtaLabel, hero.secondaryCtaLabelEl);
  // Admin-edited content occasionally carries a stray blank line between sentences; filtered
  // here so it can't open up an oversized gap in the middle of the headline (a blank line
  // still renders as a full leading-height row even though there's nothing on it).
  const headingLines = displayHeadingRaw.split("\n").filter((line) => line.trim() !== "");

  return (
    <div>
      {account ? (
        <BuyerWelcome account={account} lastOrder={lastOrder} arrivalIso={arrivalIso} locale={lang} dict={dict} />
      ) : (
        <>
      {/* Hero, 2026-11-05: the photo does the talking. Words sit low and to the left so they
          no longer cover the shoes, over a soft shade that only the bottom of the photo needs.
          No badges, no second block of copy: name, one sentence, one button, one quiet link. */}
      <section className="relative isolate flex min-h-[calc(100svh-var(--shell-header-h))] items-end overflow-hidden bg-ink">
        {/* `preload` + `fetchPriority`: this is the LCP element on every viewport. */}
        <Image
          src={hero.heroImageUrl}
          alt={h.heroImageAlt}
          fill
          preload
          fetchPriority="high"
          sizes="100vw"
          className="object-cover object-[50%_60%]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1440px] px-6 pb-14 [animation:hero-fade-up_1100ms_cubic-bezier(0.16,1,0.3,1)_both] sm:pb-20 lg:px-10">
          <p className="text-[11px] uppercase tracking-[0.24em] text-white/80">{displayEyebrow}</p>
          <h1 className="font-display mt-5 max-w-4xl text-[2.6rem] leading-[1.06] text-white sm:text-6xl lg:text-7xl">
            {headingLines.map((line, i) => (
              <span key={i}>
                {line}
                {i < headingLines.length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="mt-5 text-base text-white/85">{displayBody}</p>
          <div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
            <LinkButton href={withLocale(lang, hero.primaryCtaHref)} size="lg" className="!bg-white !text-ink hover:!bg-white/85">
              {displayPrimaryCta}
            </LinkButton>
            <Link
              href={withLocale(lang, hero.secondaryCtaHref)}
              className="text-xs font-medium uppercase tracking-[0.14em] text-white underline decoration-white/50 underline-offset-[6px] transition-colors duration-300 hover:decoration-white"
            >
              {displaySecondaryCta}
            </Link>
          </div>
        </div>
      </section>
        </>
      )}

      {/* Live order-activity strip (2026-08-14). Every figure is a real query — it renders
          nothing at all when there isn't enough genuine activity to report, rather than
          padding itself out. See OrderPulse / lib/data/orderPulse. */}
      {hero.orderPulseEnabled && <OrderPulse pulse={pulse} locale={lang} dict={dict} />}

      {/* Curated "new arrivals" shelf, in the slot the live-order strip used to hold. */}
      <NewArrivals
        styles={newArrivals}
        imagesByStyle={newArrivalImages}
        showPricing={Boolean(account)}
        priceMultiplier={account?.priceMultiplier ?? 1}
        locale={lang}
        dict={dict}
      />

      {/* Apply / log in / order — for visitors only; a signed-in buyer is past all three. */}
      {!account && (
        <>
      <BrandStory dict={dict} locale={lang} />
      {/* How ordering works — the full process, the facts a buyer checks, and real
          stockists once supplied. Replaced the three-step apply/log in/order strip. */}
      <HowOrderingWorks
        dict={dict}
        locale={lang}
        leadTimeDays={hero.productionLeadTimeDays}
        fromPrice={lowestPairPrice(styles)?.price}
      />
        </>
      )}
    </div>
  );
}
