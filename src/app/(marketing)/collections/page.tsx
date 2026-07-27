import Link from "next/link";
import { STYLES, CATEGORY_LABEL, GENDER_LABEL } from "@/lib/data/styles";
import type { Category } from "@/lib/types";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { StylePlate } from "@/components/product/StylePlate";
import { LinkButton } from "@/components/ui/Button";

export const metadata = {
  title: "Collections",
  description:
    "Browse the current Hector 1984 collection — Running, Court, and Trail. Wholesale pricing and matrix ordering unlock with an approved buyer account.",
};

const CATEGORIES: Category[] = ["running", "court", "trail"];

export default async function CollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const active = CATEGORIES.includes(category as Category) ? (category as Category) : null;
  const results = active ? STYLES.filter((s) => s.category === active) : STYLES;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10">
      <div className="border-b border-stone-300 pb-8">
        <span className="font-mono-tab text-xs uppercase tracking-[0.2em] text-ink-soft">Lookbook</span>
        <h1 className="font-display mt-2 text-3xl font-bold uppercase tracking-tight text-ink sm:text-4xl">
          Current Collection
        </h1>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">
          Browse the full range. Wholesale pricing, MOQs, and matrix ordering are visible once
          you&rsquo;re signed in with an approved account.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <CategoryPill href="/collections" active={!active} label="All" />
          {CATEGORIES.map((c) => (
            <CategoryPill key={c} href={`/collections?category=${c}`} active={active === c} label={CATEGORY_LABEL[c]} />
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((style) => (
          <Link key={style.id} href={`/product/${style.slug}`} className="group block border border-stone-300 bg-white">
            <StylePlate swatch={style.colorways[0].swatch} styleNumber={style.styleNumber} className="aspect-[4/3] w-full" />
            <div className="p-5">
              <AvailabilityBadge availability={style.availability} shipWindow={style.shipWindow} />
              <h3 className="font-display mt-2 text-lg font-bold uppercase tracking-tight text-ink group-hover:underline">
                {style.name}
              </h3>
              <p className="mt-1 text-xs text-ink-soft">
                {CATEGORY_LABEL[style.category]} · {GENDER_LABEL[style.gender]}
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                {style.colorways.map((c) => (
                  <span key={c.id} className="flex h-4 w-6 overflow-hidden border border-stone-300" title={c.name}>
                    <span className="h-full w-1/2" style={{ background: c.swatch[0] }} />
                    <span className="h-full w-1/2" style={{ background: c.swatch[1] ?? c.swatch[0] }} />
                  </span>
                ))}
              </div>
              <p className="mt-4 border-t border-stone-200 pt-3 text-xs font-medium uppercase tracking-wide text-signal">
                Sign in for wholesale pricing →
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-16 flex flex-col items-center gap-3 border-t border-stone-300 pt-10 text-center">
        <p className="text-sm text-ink-soft">Not a wholesale account yet?</p>
        <LinkButton href="/apply" size="lg">Apply for Wholesale Access</LinkButton>
      </div>
    </div>
  );
}

function CategoryPill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active ? "border-ink bg-ink text-white" : "border-stone-300 text-ink-soft hover:border-ink hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}
