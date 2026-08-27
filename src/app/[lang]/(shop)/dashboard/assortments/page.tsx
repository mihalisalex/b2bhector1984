import { getDictionary } from "@/i18n/getDictionary";
import { withLocale } from "@/i18n/paths";
import { t } from "@/i18n/format";
import type { Locale } from "@/i18n/config";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAccount } from "@/lib/session";
import { getAssortmentsForAccount } from "@/lib/data/assortments";
import { getStorefrontStyles, getStyleImageUrl } from "@/lib/data/styles";
import { deleteAssortment } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { StylePlate } from "@/components/product/StylePlate";
import { AvailabilityBadge } from "@/components/ui/Badge";
import { LoadAssortmentButton } from "@/components/dashboard/LoadAssortmentButton";
import { TextAction } from "@/components/ui/TextAction";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const dict = await getDictionary(lang as Locale);
  return { title: dict.dashboard.savedAssortments, robots: { index: false, follow: false } };
}

export default async function AssortmentsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = lang as Locale;
  const d = (await getDictionary(locale)).dashboard;
  const account = await getCurrentAccount();
  if (!account) redirect(withLocale(locale, "/login"));
  const [assortments, styles] = await Promise.all([
    getAssortmentsForAccount(account.id),
    getStorefrontStyles(),
  ]);
  const styleById = new Map(styles.map((s) => [s.id, s]));

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-10">
      <nav className="mb-4 text-xs text-ink-soft">
        <Link href={withLocale(locale, "/dashboard")} className="hover:text-ink">{d.title}</Link> / {d.savedAssortments}
      </nav>
      <h1 className="font-display border-b border-stone-300 pb-6 text-2xl font-bold uppercase tracking-tight text-ink">
        {d.savedAssortments}
      </h1>

      {assortments.length === 0 ? (
        <div className="mt-8 border border-dashed border-stone-300 bg-stone-100 px-6 py-16 text-center">
          <p className="text-sm text-ink-soft">
            {d.noAssortmentsLong}
          </p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-10">
          {assortments.map((a) => (
            <section key={a.id}>
              <div className="flex items-baseline justify-between">
                <h2 className="font-display text-lg font-bold uppercase tracking-tight text-ink">{a.name}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-ink-soft">{t(d.savedOn, { date: formatDate(a.createdAt, locale) })}</span>
                  <LoadAssortmentButton lines={a.lines} />
                  <form action={deleteAssortment}>
                    <input type="hidden" name="assortmentId" value={a.id} />
                    <TextAction type="submit" tone="danger">
                      {d.delete}
                    </TextAction>
                  </form>
                </div>
              </div>
              {a.lines.every((l) => !l.colorwayId) && (
                <p className="mt-1 text-xs text-ink-soft">
                  {d.assortmentLegacyNote}
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {a.styleIds.map((id) => {
                  const style = styleById.get(id);
                  if (!style) return null;
                  return (
                    <Link
                      key={id}
                      href={withLocale(locale, `/product/${style.slug}`)}
                      className="group border border-stone-300 bg-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-ink"
                    >
                      <StylePlate
                        swatch={style.colorways[0].swatch}
                        imageUrl={getStyleImageUrl(style)}
                        alt={style.name}
                        className="aspect-[4/3] w-full"
                        dense
                      />
                      <div className="p-3">
                        <AvailabilityBadge style={style} />
                        <p className="font-display mt-2 text-sm font-bold uppercase text-ink group-hover:underline">{style.name}</p>
                        <p className="font-mono-tab text-[11px] text-ink-soft">{style.styleNumber}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
