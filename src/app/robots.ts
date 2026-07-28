import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hector1984.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/brand-story", "/collections", "/apply", "/login"],
      disallow: [
        "/dashboard",
        "/cart",
        "/checkout",
        "/catalogue",
        "/product",
        "/linesheet",
        "/quick-order",
        "/apply/pending",
        "/admin",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
