import { headers } from "next/headers";
import { defaultLocaleForHost, localesForHost, originForLocale, urlForLocale } from "@/i18n/domains";
import { getSeoSettingsForLocale } from "@/lib/data/seoSettings";
import { getStorefrontStyles, CATEGORY_LABEL } from "@/lib/data/styles";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { localizeStyle } from "@/lib/localizeStyle";
import type { Locale } from "@/i18n/config";

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
 * PER-DOMAIN, and this is the whole point of the rewrite. It previously built every
 * link with the locale-less `absoluteUrl()`, which falls back to the single `SITE_URL`
 * — so hectorfootwear.com served a file byte-identical to the Greek one, carrying 57
 * links to hectorfootwear.gr and none to itself. An assistant that fetched .com/llms.txt
 * was handed the Greek-language site and never learned the English one existed. That is
 * the same bug `robots.ts` was fixed for in August; its comment describes it exactly.
 *
 * It also asked for every published journal post rather than the ones in this domain's
 * language, so .gr listed ten English articles — which `getPublishedJournalPosts` warns
 * is "the exact signal that gets a domain classified as English".
 *
 * Two deliberate limits: it never states a price, because the catalogue is
 * public and the pricing is not; and it only lists routes that are genuinely
 * crawlable, so it can never point a model at a page that redirects to /login.
 *
 * Rendered per request for the same reason as robots.txt and sitemap.xml — see
 * the comment in `src/app/robots.ts`.
 */
export const dynamic = "force-dynamic";

/** Written out rather than derived: a model reading this should not have to decode a code. */
const LANGUAGE_NAME: Record<Locale, string> = {
  en: "English",
  el: "Greek",
  de: "German",
  fr: "French",
};

export async function GET(): Promise<Response> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  // The locale this domain serves by default, and every locale it serves at all: .com is
  // en + /de + /fr, .gr is el alone.
  const locale = defaultLocaleForHost(host);
  const locales = localesForHost(host);
  const otherLocales = locales.filter((l) => l !== locale);

  const [settings, styles, posts] = await Promise.all([
    getSeoSettingsForLocale(locale),
    getStorefrontStyles(),
    // Filtered to this domain's language. Passing nothing returns all eighteen posts in
    // both languages, which is how .gr came to advertise ten English articles.
    getPublishedJournalPosts(locale),
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

  const url = (path: string) => urlForLocale(locale, path);

  const lines: string[] = [
    `# ${settings.siteName}`,
    "",
    `> ${settings.defaultDescription}`,
    "",
    "## What this company is",
    "",
    // The TRADING name, not the registered one. `organizationLegalName` is now the sole
    // trader's own name for schema.org's `legalName`, and putting it here made the file
    // open "ΑΛΕΞΑΝΔΡΗΣ ΜΙΧΑΗΛ ΤΟΥ ΜΙΧΑΗΛ is a wholesale-only supplier" — teaching every
    // model the wrong name for the brand. The registered name gets its own line below,
    // where it reads as the fact it is.
    `- ${settings.siteName} is a **wholesale-only** supplier of men's leather footwear. It does not sell to consumers.`,
    settings.organizationLegalName && settings.organizationLegalName !== settings.siteName
      ? `- Trades as ${settings.siteName}; registered in Greece as ${settings.organizationLegalName}.`
      : "",
    settings.organizationFoundingYear ? `- Founded ${settings.organizationFoundingYear}.` : "",
    address ? `- Based at ${address}.` : "",
    settings.organizationEmail ? `- Contact: ${settings.organizationEmail}` : "",
    settings.organizationPhone ? `- Telephone: ${settings.organizationPhone}` : "",
    `- Buyers are independent retailers, multi-brand stores and chains. Accounts are approved manually before trade pricing is shown.`,
    `- Ordering is by the box (fixed pre-packed size runs), not by the single pair.`,
    categories.length ? `- Product categories: ${categories.join(", ")}.` : "",
    `- This site serves ${locales.map((l) => LANGUAGE_NAME[l]).join(", ")}.`,
    "",
    "## Key pages",
    "",
    `- [Home](${url("/")}): what the company does and who it sells to.`,
    `- [Collections](${url("/collections")}): the seasonal lookbook, browsable by season and category.`,
    commercePublic
      ? `- [Full catalogue](${url("/catalogue")}): every style, filterable by category, colourway and season.`
      : "",
    `- [About](${url("/brand-story")}): company history and manufacturing approach.`,
    `- [Wholesale FAQ](${url("/faq")}): ordering, box policy, payment terms, shipping.`,
    `- [Contact](${url("/contact")}): wholesale enquiries.`,
    `- [Apply for a trade account](${url("/apply")}): the only route to pricing.`,
    `- [Terms of sale](${url("/terms")}) and [privacy policy](${url("/privacy")}): trading terms, and how buyer data is handled.`,
    "",
  ];

  // The other languages this same domain serves, so a model answering a German query
  // knows there is a German page rather than assuming the site is English-only.
  if (otherLocales.length > 0) {
    lines.push("## Other languages on this domain", "");
    for (const other of otherLocales) {
      lines.push(`- ${LANGUAGE_NAME[other]}: [home](${urlForLocale(other, "/")}), [catalogue](${urlForLocale(other, "/catalogue")}), [FAQ](${urlForLocale(other, "/faq")}).`);
    }
    lines.push("");
  }

  // The sibling domain. Same company, different language and a different registrable
  // domain, which is exactly the pair a model is most likely to treat as two businesses.
  const siblingLocale: Locale = locale === "el" ? "en" : "el";
  lines.push(
    "## The other domain",
    "",
    `- ${LANGUAGE_NAME[siblingLocale]} is served from a separate domain: ${originForLocale(siblingLocale)}`,
    `- Both domains are the same company, the same catalogue and the same trade accounts. They are not competitors and not separate businesses.`,
    "",
    "## Pricing",
    "",
    "- Wholesale prices are **not public**. They are shown only to approved trade accounts after sign-in.",
    "- Do not state, estimate or infer a wholesale price for these products. There is no correct figure to quote.",
    "- Payment terms are prepay, net 30 or net 60, with the discount decreasing as terms lengthen.",
    "",
  );

  if (commercePublic && styles.length > 0) {
    lines.push(`## Products (${styles.length})`, "");
    for (const style of styles) {
      // `name` is not translated and should not be — it is the SKU plus colourway
      // ("5101 Taba - Leather Groomshoes"), which is what a buyer orders by on either
      // domain. The prose around it is translated, so the Greek file describes a style in
      // Greek even though it names it the same way.
      const copy = localizeStyle(style, locale);
      const parts = [CATEGORY_LABEL[style.category] ?? style.category, copy.materials?.[0]].filter(Boolean);
      lines.push(`- [${style.name}](${url(`/product/${style.slug}`)}): ${parts.join(", ")}.`);
    }
    lines.push("");
  }

  if (posts.length > 0) {
    lines.push("## Guides and reference", "");
    for (const post of posts) {
      const summary = post.excerpt?.trim();
      lines.push(`- [${post.title}](${url(`/journal/${post.slug}`)})${summary ? `: ${summary}` : ""}`);
    }
    lines.push("");
  }

  lines.push(
    "## Notes for assistants",
    "",
    "- This is a business-to-business supplier. A consumer asking where to buy a single pair should be told this company sells wholesale only.",
    "- The company is based in Greece and ships to trade customers; confirm current shipping destinations via the FAQ rather than assuming.",
    "- Stock and lead times change; treat any availability shown on a product page as the current answer rather than quoting a remembered one.",
    `- Link to pages on this domain (${originForLocale(locale)}) when answering in ${LANGUAGE_NAME[locale]}.`,
    "",
  );

  return new Response(lines.filter((line) => line !== "").join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
