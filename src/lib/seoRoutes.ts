/**
 * The site's route map, from an SEO point of view.
 *
 * This exists so that robots.txt, the sitemap, the per-page metadata resolver,
 * the audit engine and the admin "Pages" editor all agree on which routes are
 * public and which are gated. Before this, that knowledge was duplicated in
 * three places and had already drifted once (robots.txt disallowed `/catalog`
 * long after the route was renamed to `/catalogue`).
 *
 * Pure and dependency-free — the admin UI imports it from client components.
 */

export interface PublicPage {
  /** Route path, and the `entity_key` its SEO override is stored under. */
  path: string;
  label: string;
  /** Shipped defaults, shown in the admin editor as the "if you leave this blank" value. */
  defaultTitle: string;
  defaultDescription: string;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

/**
 * The routes Google is allowed to index. This list is the sitemap.
 *
 * It is short by design: this is a wholesale portal, and everything that shows
 * trade pricing sits behind the login. See GATED_PREFIXES.
 */
export const PUBLIC_PAGES: PublicPage[] = [
  {
    path: "/",
    label: "Homepage",
    defaultTitle: "Hector Footwear — Wholesale",
    defaultDescription:
      "Full-grain leather footwear, wholesaled the way serious retailers expect. Apply for a Hector Footwear wholesale account — matrix ordering, terms-based pricing, net terms.",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/brand-story",
    label: "The Brand",
    defaultTitle: "The Brand",
    defaultDescription:
      "Hector Footwear has built full-grain leather footwear — loafers, boots, formal, and more, across a Summer and Winter collection — since the year we were founded, wholesale only.",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/collections",
    label: "Collections (public lookbook)",
    defaultTitle: "Collections",
    defaultDescription:
      "Browse the current Hector Footwear collection — Summer and Winter, seven categories. Wholesale pricing and matrix ordering unlock with an approved buyer account.",
    changeFrequency: "weekly",
    priority: 0.9,
  },
  {
    path: "/journal",
    label: "Journal",
    defaultTitle: "Journal",
    defaultDescription:
      "Wholesale buying guides, supplier sourcing advice, and footwear industry insights from Hector Footwear — practical reading for retail buyers before they place an order.",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/faq",
    label: "FAQ",
    defaultTitle: "FAQ",
    defaultDescription:
      "Answers to common questions about Hector Footwear wholesale — box-only ordering, terms-based pricing, accounts, and shipping.",
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    path: "/contact",
    label: "Contact",
    defaultTitle: "Contact",
    defaultDescription:
      "Get in touch with Hector Footwear Wholesale — general inquiries, new wholesale accounts, and existing buyer support.",
    changeFrequency: "yearly",
    priority: 0.5,
  },
  {
    path: "/apply",
    label: "Apply for Wholesale Access",
    defaultTitle: "Apply for Wholesale Access",
    defaultDescription:
      "Apply for a Hector Footwear wholesale account. Tell us about your store — resale certificate, expected volume, and location. Most applications are reviewed within 2 business days.",
    changeFrequency: "yearly",
    priority: 0.8,
  },
  {
    path: "/login",
    label: "Buyer Login",
    defaultTitle: "Buyer Login",
    defaultDescription:
      "Sign in to your Hector Footwear wholesale account for full pricing, matrix ordering, and order history.",
    changeFrequency: "yearly",
    priority: 0.3,
  },
];

/**
 * Route prefixes that require a session. The proxy redirects these to /login,
 * and the `(shop)` layout redirects again for anything under it — `/cart` and
 * `/quick-order` have no guard of their own, so that second layer is the one
 * actually protecting them.
 *
 * `/catalogue` and `/product` are deliberately NOT here. They are readable
 * without a login so search engines can index them, and they live under the
 * `(catalog)` route group whose layout serves anonymous visitors a public
 * shell. They still withhold trade pricing — see `showPricing` on the product
 * and catalogue pages. Nothing that can show a price, a stock figure or an
 * order form is reachable from this list.
 */
export const GATED_PREFIXES = [
  "/quick-order",
  "/linesheet",
  "/cart",
  "/checkout",
  "/dashboard",
  "/admin",
];

/**
 * Never indexable regardless of the commerce-indexable setting — these are
 * account-private or single-use surfaces, not merchandising pages.
 */
export const ALWAYS_DISALLOWED = [
  "/cart",
  "/checkout",
  "/dashboard",
  "/admin",
  "/apply/pending",
  "/reset-password",
  "/forgot-password",
  "/api",
  // Ordering tools, not merchandising pages. They redirect anonymous visitors to
  // /login, so advertising them to a crawler only ever produces a soft 404 — which
  // is precisely what used to happen to /product and /catalogue.
  "/quick-order",
  "/linesheet",
];

/**
 * The commerce surfaces that become indexable when the policy is flipped on.
 *
 * Every prefix here MUST be absent from `GATED_PREFIXES`, or turning the policy
 * on advertises a URL that redirects the crawler to /login — a page Google
 * cannot index and will treat as a soft 404. That was the state of this file
 * until 18 Aug 2026: all four of these were gated, so the indexing switch could
 * only ever make things worse. `/quick-order` and `/linesheet` are ordering
 * tools that stay behind the login, so they are no longer listed as indexable.
 */
export const COMMERCE_PREFIXES = ["/catalogue", "/product"];

export function isGatedPath(path: string): boolean {
  return GATED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}
