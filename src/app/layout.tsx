import type { Metadata } from "next";
import { archivo, inter, plexMono } from "@/lib/fonts";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hector1984.com";
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
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Hector 1984 — Wholesale",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hector 1984 — Wholesale",
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
      className={`${archivo.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-stone-50 text-ink">
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
