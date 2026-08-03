import type { Metadata } from "next";
import { bodySans, displaySerif, mono } from "@/lib/fonts";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_URL } from "@/lib/siteUrl";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { buildSiteSchemas } from "@/lib/seoJsonLd";
import "./globals.css";

/**
 * Site-wide defaults. Every value here is admin-editable in /admin/seo/settings
 * — this function reads the `seo_settings` row and falls back to the shipped
 * defaults if migration 0025 hasn't run.
 */
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
    // Deliberately no `title`/`url` here: those are per-page and come from
    // `pageMetadata()` (src/lib/seo.ts). Hardcoding them at the root made every share
    // card read "Hector Footwear — Wholesale" and link to the site root. Likewise no
    // root-level `alternates.canonical` — Next resolves it against `metadataBase`, so a
    // single value would canonicalise every route to the homepage.
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Organization + WebSite, emitted once for the whole site with stable `@id`s
  // that per-page schemas reference instead of repeating the publisher block.
  const siteSchemas = await buildSiteSchemas();

  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${bodySans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-50 text-ink">
        {children}
        <CookieConsentBanner />
        <JsonLd schema={siteSchemas} />
      </body>
    </html>
  );
}
