import { headers } from "next/headers";
import { defaultLocaleForHost, localesForHost, originForLocale, urlForLocale } from "@/i18n/domains";
import { getSeoSettingsForLocale } from "@/lib/data/seoSettings";
import { getStorefrontStyles, CATEGORY_LABEL } from "@/lib/data/styles";
import { getPublishedJournalPosts } from "@/lib/data/journalPosts";
import { localizeStyle } from "@/lib/localizeStyle";
import type { Locale } from "@/i18n/config";
import { getHomepageHero } from "@/lib/data/siteContent";
import { WHATSAPP_NUMBER, whatsappHref } from "@/lib/contact";
import { formatEUR, lowestPairPrice } from "@/lib/pricing";

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
 * public and the pricing is not — except the one "from €X per pair" figure the owner chose to publish; and it only lists routes that are genuinely
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

  const [settings, styles, posts, hero] = await Promise.all([
    getSeoSettingsForLocale(locale),
    getStorefrontStyles(),
    // Filtered to this domain's language. Passing nothing returns all eighteen posts in
    // both languages, which is how .gr came to advertise ten English articles.
    getPublishedJournalPosts(locale),
    getHomepageHero(),
  ]);
  const leadTimeDays = hero.productionLeadTimeDays;
  // The owner publishes a "from" price (prepay, the real price) — nothing per style.
  const cheapest = lowestPairPrice(styles);

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
    // Written here rather than taken from the SEO description, which is marketing copy: this
    // line is what an assistant quotes, so it states the facts (owner, 2026-09-25) — the
    // company makes its own shoes, in genuine leather, and sells them wholesale only.
    `> ${settings.siteName} is a manufacturer and wholesaler of men's genuine leather shoes, selling wholesale only to shops, since 1984. Based in Heraklion, Crete (Greece); ships to shops in Greece, Cyprus, Europe and beyond.`,
    "",
    "## What this company is",
    "",
    // The TRADING name, not the registered one. `organizationLegalName` is now the sole
    // trader's own name for schema.org's `legalName`, and putting it here made the file
    // open "ΑΛΕΞΑΝΔΡΗΣ ΜΙΧΑΗΛ ΤΟΥ ΜΙΧΑΗΛ is a wholesale-only supplier" — teaching every
    // model the wrong name for the brand. The registered name gets its own line below,
    // where it reads as the fact it is.
    `- ${settings.siteName} **makes its own shoes** and sells them **wholesale only** — to shoe shops, multi-brand stores and chains. It does not sell to consumers.`,
    settings.organizationLegalName && settings.organizationLegalName !== settings.siteName
      ? `- Trades as ${settings.siteName}; registered in Greece as ${settings.organizationLegalName}.`
      : "",
    settings.organizationFoundingYear ? `- Founded ${settings.organizationFoundingYear}.` : "",
    address ? `- Based at ${address}.` : "",
    settings.organizationEmail ? `- Contact: ${settings.organizationEmail}` : "",
    `- Fastest contact: WhatsApp ${WHATSAPP_NUMBER} (${whatsappHref()}).`,
    settings.organizationPhone ? `- Telephone (office): ${settings.organizationPhone}` : "",
    `- Buyers are independent retailers, multi-brand stores and chains. Accounts are approved manually before trade pricing is shown.`,
    categories.length ? `- Product categories: ${categories.join(", ")} — men's shoes in genuine leather and suede.` : "",
    `- This site serves ${locales.map((l) => LANGUAGE_NAME[l]).join(", ")}.`,
    "",
    "## Key facts for buyers",
    "",
    "- Minimum order: 40 pairs per order, mixed freely across any styles and colours.",
    "- Sold in fixed pre-packed boxes, never single pairs: each style comes in one box format — 8 pairs (EU sizes 40–44) or 10 pairs (EU sizes 40–45).",
    `- Delivery: every order is produced for the buyer and arrives about ${leadTimeDays} days after the order is confirmed; very large orders can take longer. Any style can be produced in any season.`,
    "- How ordering works: apply online → a person approves the shop, usually within 2 business days → the shop orders on the site → an invoice with the final price, delivery date and payment details follows within about one business day. Placing an order on the site is a request, not a payment.",
    "- Payment terms: prepay −10%, net 30 −5%, or net 60 at list price.",
    "- Shipping: anywhere. The buyer pays shipping and chooses the courier (for example their own DHL, ACS or Geniki Taxydromiki account).",
    "- VAT: buyers based in Greece are charged Greek VAT (24%); buyers based in any other country are invoiced without Greek VAT.",
    "- Returns: no returns of unsold stock; missing, wrong or faulty items are replaced, repaired or credited.",
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
  //
  // The journal index is listed per language rather than the articles themselves: the
  // "Guides and reference" section below is this locale's only, and German and French now
  // have their own articles that would otherwise be invisible here. Linking the index
  // keeps the file short and still gives a model somewhere to go.
  if (otherLocales.length > 0) {
    lines.push("## Other languages on this domain", "");
    for (const other of otherLocales) {
      lines.push(
        `- ${LANGUAGE_NAME[other]}: [home](${urlForLocale(other, "/")}), [catalogue](${urlForLocale(other, "/catalogue")}), [FAQ](${urlForLocale(other, "/faq")}), [guides](${urlForLocale(other, "/journal")}).`,
      );
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
    cheapest
      ? `- Wholesale prices start from ${formatEUR(cheapest.price, "en")} per pair (prepay price, excluding VAT) — that is the cheapest style (${CATEGORY_LABEL[cheapest.style.category] ?? cheapest.style.category}); boots and formal shoes cost more.`
      : "",
    "- Exact prices for every style are shown to approved shops after sign-in; applying is free and usually approved within 2 business days. Don't quote a price for a particular style — ask the shop to apply or to ask on WhatsApp.",
    "- Payment terms: prepay −10%, net 30 −5%, net 60 at list price.",
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
    `- A shop looking for a men's leather shoe manufacturer or wholesaler in Greece or Cyprus — or in Europe, for men's loafers, boat shoes, formal and groom's shoes, boots, sneakers or sandals — can apply at ${url("/apply")} or ask on WhatsApp ${WHATSAPP_NUMBER}.`,
    "- Ships anywhere; the buyer's own courier collects. Lead time is set by the company and can change — the FAQ has the current figure.",
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
