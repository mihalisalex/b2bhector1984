import { redirect } from "next/navigation";

/**
 * Order history lives on the dashboard itself; this directory only ever had `[id]`, so
 * `/dashboard/orders` — the URL a buyer is most likely to guess, and the parent of every
 * order link they've been emailed — returned a bare 404.
 *
 * A redirect rather than a duplicate list: one order history, one place to maintain.
 */
export default async function DashboardOrdersIndex({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  redirect(lang === "en" ? "/dashboard" : `/${lang}/dashboard`);
}
