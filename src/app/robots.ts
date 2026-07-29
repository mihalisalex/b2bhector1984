import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/brand-story", "/collections", "/apply", "/login", "/forgot-password"],
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
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
