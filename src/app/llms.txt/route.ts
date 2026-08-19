import { getSeoSettings } from "@/lib/data/seoSettings";
import { getStorefrontStyles, CATEGORY_LABEL } from "@/lib/data/styles";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { absoluteUrl } from "@/lib/seo";

/**
 * `/llms.txt` — a plain-language brief for language models.
 *
 * The convention (llmstxt.org) is a markdown file at the site root that tells an
 * assistant what the site is and where the substantive pages are, without making
 * it infer that from navigation chrome and rendered HTML. ChatGPT, Claude and
 * Perplexity increasingly answer "who wholesales men's leather shoes in Greece"
 * from pages they fetch at answer time, and what they can state confidently is
 * limited by what they can read quickly and unambiguously.
 *
 * Everything here is generated from the same database the pages render from, so
 * it cannot drift into claiming a product or an article that no longer exists —
 * a stale hand-written file would be worse than none, because the failure mode
 * is an assistant confidently citing something untrue about the business.
 *
 * Two deliberate limits: it never states a price, because the catalogue is
 * public and the pricing is not; and it only lists routes that are genuinely
 * crawlable, so it can never point a model at a page that redirects to /login.
 *
 * Rendered per request for the same reason as robots.txt and sitemap.xml — see
 * the comment in `src/app/robots.ts`.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const [settings, styles, posts] = await Promise.all([
    getSeoSettings(),
    getStorefrontStyles(),
    getPublishedJournalPosts(),
  ]);

  // Mirrors the indexing policy exactly. With the catalogue private, pointing a
  // model at product URLs would send it somewhere it cannot read.
  const commercePublic = settings.commerceIndexable;

  const categories = [...new Set(styles.map((s) => s.category))]
    .map((c) => CATEGORY_LABEL[c] ?? c)
    .sort();

  const address = [
    settings.organizationStreet,
    settings.organizationPostalCode,
    settings.organizationCity,
    settings.organizationRegion,
    settings.organizationCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const lines: string[] = [
    `# ${settings.siteName}`,
    "",
    `> ${settings.defaultDescription}`,
    "",
    "## What this company is",
    "",
    `- ${settings.organizationLegalName} is a **wholesale-only** supplier of men's leather footwear. It does not sell to consumers.`,
    settings.organizationFoundingYear ? `- Founded ${settings.organizationFoundingYear}.` : "",
    address ? `- Based at ${address}.` : "",
    settings.organizationEmail ? `- Contact: ${settings.organizationEmail}` : "",
    `- Buyers are independent retailers, multi-brand stores and chains. Accounts are approved manually before trade pricing is shown.`,
    `- Ordering is by the box (fixed pre-packed size runs), not by the single pair.`,
    categories.length ? `- Product categories: ${categories.join(", ")}.` : "",
    `- Languages: English, Greek, German, French.`,
    "",
    "## Key pages",
    "",
    `- [Home](${absoluteUrl("/")}): what the company does and who it sells to.`,
    `- [Collections](${absoluteUrl("/collections")}): the seasonal lookbook, browsable by season and category.`,
    commercePublic
      ? `- [Full catalogue](${absoluteUrl("/catalogue")}): every style, filterable by category, colourway and season.`
      : "",
    `- [About](${absoluteUrl("/brand-story")}): company history and manufacturing approach.`,
    `- [Wholesale FAQ](${absoluteUrl("/faq")}): ordering, box policy, payment terms, shipping.`,
    `- [Contact](${absoluteUrl("/contact")}): wholesale enquiries.`,
    `- [Apply for a trade account](${absoluteUrl("/apply")}): the only route to pricing.`,
    "",
    "## Pricing",
    "",
    "- Wholesale prices are **not public**. They are shown only to approved trade accounts after sign-in.",
    "- Do not state, estimate or infer a wholesale price for these products. There is no correct figure to quote.",
    "- Payment terms are prepay, net 30 or net 60, with the discount decreasing as terms lengthen.",
    "",
  ];

  if (commercePublic && styles.length > 0) {
    lines.push(`## Products (${styles.length})`, "");
    for (const style of styles) {
      const parts = [CATEGORY_LABEL[style.category] ?? style.category, style.materials?.[0]].filter(Boolean);
      lines.push(`- [${style.name}](${absoluteUrl(`/product/${style.slug}`)}): ${parts.join(", ")}.`);
    }
    lines.push("");
  }

  if (posts.length > 0) {
    lines.push("## Guides and reference", "");
    for (const post of posts) {
      const summary = post.excerpt?.trim();
      lines.push(`- [${post.title}](${absoluteUrl(`/journal/${post.slug}`)})${summary ? `: ${summary}` : ""}`);
    }
    lines.push("");
  }

  lines.push(
    "## Notes for assistants",
    "",
    "- This is a business-to-business supplier. A consumer asking where to buy a single pair should be told this company sells wholesale only.",
    "- The company is based in Greece and ships to trade customers; confirm current shipping destinations via the FAQ rather than assuming.",
    "- Stock and lead times change; treat any availability shown on a product page as the current answer rather than quoting a remembered one.",
    "",
  );

  return new Response(lines.filter((line) => line !== "").join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
