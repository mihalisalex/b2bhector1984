import type { Metadata } from "next";

/**
 * Builds the per-page metadata every publicly indexable route needs.
 *
 * Two things this exists to get right, both of which were previously wrong:
 *
 *  - **Canonical.** Next resolves `alternates.canonical` against `metadataBase`, so a
 *    single `canonical: "/"` in the root layout would point *every* page at the homepage
 *    and actively deindex the rest. Canonicals therefore have to be declared per route,
 *    which is what `path` is for.
 *  - **Open Graph title/url.** The root layout hardcoded both, so every share card read
 *    "Hector 1984 — Wholesale" and linked to the site root regardless of the page. Here
 *    they're derived from the page's own title and path instead.
 *
 * Only use this for routes that are allowed in robots.txt — the gated commerce surfaces
 * (catalogue, product, cart, checkout, dashboard, admin) are intentionally noindex and
 * must not advertise canonicals.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  /** Page title *without* the site suffix — the root layout's template appends it. */
  title: string;
  description: string;
  /** Route path with a leading slash; "/" for the homepage. */
  path: string;
}): Metadata {
  const isHome = path === "/";
  // The title template only applies to `title`, not to openGraph/twitter, so build the
  // full form once here to keep share cards consistent with the browser tab. The
  // homepage opts out of the template via `absolute` — it already carries the brand
  // name, and letting the suffix append would render "… Wholesale — … Wholesale".
  const fullTitle = isHome ? title : `${title} — Hector 1984 Wholesale`;
  return {
    title: isHome ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path },
    twitter: { title: fullTitle, description },
  };
}
