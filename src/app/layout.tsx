import type { Metadata } from "next";
import { bodySans, displaySerif, mono } from "@/lib/fonts";
import { CookieConsentBanner } from "@/components/layout/CookieConsentBanner";
import { SITE_URL } from "@/lib/siteUrl";
import "./globals.css";

const SITE_NAME = "Hector 1984 Wholesale";
const DESCRIPTION =
  "Full-grain leather footwear, wholesaled the way serious retailers expect. Apply for a Hector 1984 wholesale account — matrix ordering, terms-based pricing, net terms.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Hector 1984 — Wholesale",
    template: "%s — Hector 1984 Wholesale",
  },
  description: DESCRIPTION,
  keywords: [
    "footwear wholesale",
    "wholesale sneakers",
    "wholesale boots and formal shoes",
    "B2B footwear",
    "independent retailer wholesale account",
  ],
  robots: { index: true, follow: true },
  // Deliberately no `title`/`url` here: those are per-page and come from
  // `pageMetadata()` (src/lib/seo.ts). Hardcoding them at the root made every share
  // card read "Hector 1984 — Wholesale" and link to the site root. Likewise no
  // root-level `alternates.canonical` — Next resolves it against `metadataBase`, so a
  // single value would canonicalise every route to the homepage.
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    description: DESCRIPTION,
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hector 1984",
  url: SITE_URL,
  description: DESCRIPTION,
  foundingDate: "1984",
  slogan: "Track-engineered footwear, wholesaled the way serious retailers expect.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${bodySans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-50 text-ink">
        {children}
        <CookieConsentBanner />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
