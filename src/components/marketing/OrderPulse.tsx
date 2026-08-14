import Image from "next/image";
import Link from "next/link";
import type { OrderPulse as OrderPulseData } from "@/lib/data/orderPulse";
import type { Locale } from "@/i18n/config";
import { withLocale } from "@/i18n/paths";

/**
 * Homepage order-activity strip — real figures only (see `@/lib/data/orderPulse`).
 *
 * Renders nothing when there isn't enough genuine activity to report. That's deliberate: a
 * quiet week is normal for wholesale, and a strip that pads itself out on quiet days stops
 * being information and becomes a claim.
 *
 * Layout is a 2-up on desktop — the best seller's photo carries the left, the live counters
 * the right — collapsing to stacked on mobile with the photo first.
 */
export function OrderPulse({ pulse, locale }: { pulse: OrderPulseData; locale: Locale }) {
  if (!pulse.hasSignal || !pulse.topStyle) return null;

  const { todayCount, weekCount, topStyle, stylesMoved, stylesTotal } = pulse;
  const href = withLocale(locale, `/product/${topStyle.slug}`);

  return (
    <section className="relative isolate overflow-hidden border-b border-stone-300 bg-ink text-white">
      {/* Soft off-centre glow so the flat black reads as lit rather than empty. Purely
          decorative and behind everything via -z-10. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 h-[38rem] w-[38rem] rounded-full opacity-[0.16] blur-3xl"
        style={{
          right: "-8rem",
          top: "-14rem",
          background: "radial-gradient(circle, #b9a68f 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto max-w-[1440px] px-6 py-14 lg:px-10 lg:py-20">
        <div className="flex items-center gap-2.5">
          {/* Live dot — decorative; the adjacent label carries the meaning. */}
          <span className="relative flex h-1.5 w-1.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-live" />
          </span>
          <span className="font-mono-tab text-[11px] uppercase tracking-[0.25em] text-live">
            Live order activity
          </span>
        </div>

        <div className="mt-10 grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* --- Best seller, with photo --- */}
          <Link href={href} className="group block lg:min-w-0">
            <div className="flex items-center gap-6 sm:gap-8">
              <div className="relative aspect-square w-32 shrink-0 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10 sm:w-40 lg:w-44">
                {topStyle.imageUrl ? (
                  <Image
                    src={topStyle.imageUrl}
                    alt={topStyle.name}
                    fill
                    sizes="(min-width: 1024px) 176px, 160px"
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                ) : (
                  <div className="h-full w-full bg-white/5" />
                )}
              </div>

              <div className="min-w-0">
                <span className="font-mono-tab text-[10px] uppercase tracking-[0.22em] text-stone-300/60">
                  Most ordered this month
                </span>
                <h2 className="font-display mt-2 text-2xl font-bold uppercase leading-[1.03] tracking-tight text-white underline-offset-[6px] group-hover:underline sm:text-[1.75rem]">
                  {topStyle.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono-tab text-[10px] uppercase tracking-[0.14em] text-stone-200">
                    {topStyle.styleNumber}
                  </span>
                  <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono-tab text-[10px] uppercase tracking-[0.14em] text-stone-200">
                    {topStyle.boxes} boxes
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* --- Counters ---
              Each label names its own unit. An earlier pass trimmed these to "today" /
              "this week" for a tighter dashboard look, which read as "2 what?" — the number
              and its noun have to survive being read on their own. */}
          <dl className="grid grid-cols-3 gap-x-4 border-t border-white/10 pt-8 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
            <Stat value={String(todayCount)} label={todayCount === 1 ? "order today" : "orders today"} />
            <Stat value={String(weekCount)} label="orders this week" />
            <Stat value={String(stylesMoved)} label={`of ${stylesTotal} styles ordered this month`} />
          </dl>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <dd className="font-display text-4xl font-bold leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">
        {value}
      </dd>
      <dt className="mt-2.5 text-[11px] uppercase leading-snug tracking-[0.1em] text-stone-300/70">
        {label}
      </dt>
    </div>
  );
}
