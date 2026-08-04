import type { Metadata } from "next";
import { bodySans, displaySerif, mono } from "@/lib/fonts";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/siteUrl";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { buildSiteSchemas } from "@/lib/seoJsonLd";
import { LOCALES, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/getDictionary";
import { I18nProvider } from "@/i18n/I18nProvider";
import "@/app/globals.css";

/**
 * Root layout for the whole storefront ((marketing) + (shop)). This is one half of Next's
 * "multiple root layouts" pattern — src/app/(admin)/admin/layout.tsx is the other, its own
 * independent <html>/<body>. There is no longer a single shared src/app/layout.tsx; proxy.ts
 * guarantees `lang` here is always one of LOCALES (see its doc comment), so no notFound()
 * guard is needed for an invalid value.
 */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: settings.defaultTitle,
      template: settings.titleTemplate,
    },
    description: settings.defaultDescription,
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: settings.siteName,
      description: settings.defaultDescription,
    },
    twitter: {
      card: settings.defaultTwitterCard as "summary" | "summary_large_image",
      site: settings.twitterSite,
      description: settings.defaultDescription,
    },
    verification: {
      google: settings.googleSiteVerification,
      other: settings.bingSiteVerification
        ? { "msvalidate.01": settings.bingSiteVerification }
        : undefined,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Typed as `string`, not `Locale`, to structurally match Next's generated `LayoutProps<"/[lang]">` —
  // a narrower param type breaks the generated route-type validator. proxy.ts guarantees this is
  // always one of LOCALES before a request ever reaches this layout.
  params: Promise<{ lang: string }>;
}) {
  const { lang: rawLang } = await params;
  const lang = rawLang as Locale;

  const [dict, siteSchemas] = await Promise.all([getDictionary(lang), buildSiteSchemas(lang)]);

  return (
    <html
      lang={lang}
      className={`${displaySerif.variable} ${bodySans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-50 text-ink">
        <I18nProvider locale={lang} dict={dict}>
          {children}
        </I18nProvider>
        <CookieConsentBanner />
        <JsonLd schema={siteSchemas} />
      </body>
    </html>
  );
}
