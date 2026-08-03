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
 * Public but deliberately kept out of the sitemap: legal boilerplate has no
 * search value and dilutes the crawl budget of a seven-page site. They stay
 * crawlable (not disallowed) so the footer links don't lead into a wall.
 */
export const PUBLIC_UNLISTED_PAGES = ["/terms", "/privacy", "/cookies"];

/**
 * Route prefixes behind the login. These are disallowed in robots.txt AND
 * declare `noindex` in their own metadata, unless the `commerce_indexable`
 * setting is turned on. Both are needed: `Disallow` prevents crawling but not
 * indexing of a URL discovered from an external link, and a `noindex` tag on a
 * disallowed page can never be read.
 */
export const GATED_PREFIXES = [
  "/catalogue",
  "/product",
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
];

/** The commerce surfaces that become indexable when the policy is flipped on. */
export const COMMERCE_PREFIXES = ["/catalogue", "/product", "/quick-order", "/linesheet"];

export function isGatedPath(path: string): boolean {
  return GATED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function findPublicPage(path: string): PublicPage | undefined {
  return PUBLIC_PAGES.find((page) => page.path === path);
}
