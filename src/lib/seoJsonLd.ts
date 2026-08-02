import "server-only";
import { SITE_URL } from "@/lib/siteUrl";
import { absoluteUrl } from "@/lib/seo";
import { getSeoSettings, type SeoSettings } from "@/lib/data/seoSettings";
import { generateProductDescription, type ProductSeoSource } from "@/lib/seoAutogen";
import type { Style } from "@/lib/types";

/**
 * JSON-LD builders.
 *
 * Every builder returns a plain object or `null`; `null` means "this schema is
 * switched off in the SEO settings, or there isn't enough real data to emit it
 * validly". Emitting a half-populated schema is worse than emitting none —
 * Search Console flags incomplete required fields as errors against the whole
 * page, so the rule here is: only claim what the database actually knows.
 *
 * Notably absent: AggregateRating and Review. This app has no reviews feature
 * and no ratings data anywhere, and fabricating them would be both a Google
 * structured-data policy violation (rating markup must reflect genuine
 * user-supplied ratings) and a lie to buyers. `buildProductSchema` therefore
 * omits those properties entirely rather than inventing numbers — see the
 * `reviews` note in the admin SEO dashboard.
 */

export type JsonLd = Record<string, unknown>;

/** Drops undefined/null/empty-array/empty-string keys so no schema ships a hollow property. */
function compact(input: JsonLd): JsonLd {
  const out: JsonLd = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out;
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

/**
 * Organization, with a stable `@id` that every other schema on the site
 * references instead of repeating the publisher block. This is what lets
 * Google merge the graph across pages into one entity.
 */
export function buildOrganizationSchema(settings: SeoSettings): JsonLd | null {
  if (!settings.schemaOrganization) return null;

  const hasAddress = Boolean(settings.organizationStreet || settings.organizationCity);
  const address = hasAddress
    ? compact({
        "@type": "PostalAddress",
        streetAddress: settings.organizationStreet,
        addressLocality: settings.organizationCity,
        addressRegion: settings.organizationRegion,
        postalCode: settings.organizationPostalCode,
        addressCountry: settings.organizationCountry,
      })
    : undefined;

  const contactPoint =
    settings.organizationEmail || settings.organizationPhone
      ? compact({
          "@type": "ContactPoint",
          contactType: "sales",
          email: settings.organizationEmail,
          telephone: settings.organizationPhone,
          areaServed: settings.organizationCountry,
        })
      : undefined;

  return compact({
    "@context": "https://schema.org",
    "@type": settings.localBusinessEnabled ? "LocalBusiness" : "Organization",
    "@id": ORGANIZATION_ID,
    name: settings.siteName,
    legalName: settings.organizationLegalName,
    url: SITE_URL,
    logo: settings.organizationLogoUrl ? absoluteUrl(settings.organizationLogoUrl) : `${SITE_URL}/icon`,
    description: settings.defaultDescription,
    foundingDate: settings.organizationFoundingYear,
    email: settings.organizationEmail,
    telephone: settings.organizationPhone,
    address,
    contactPoint,
    openingHours: settings.localBusinessEnabled ? settings.openingHours : undefined,
    sameAs: settings.socialProfiles,
  });
}

/**
 * WebSite + SearchAction.
 *
 * The site search this points at (`/catalogue?q=`) is behind the login, so the
 * SearchAction is only emitted when the catalogue is actually public. Pointing
 * Google's sitelinks searchbox at a URL that 307s to /login would be a broken
 * promise, and Search Console reports it as such.
 */
export function buildWebsiteSchema(settings: SeoSettings): JsonLd | null {
  if (!settings.schemaWebsite) return null;

  const potentialAction = settings.commerceIndexable
    ? {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/catalogue?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      }
    : undefined;

  return compact({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: SITE_URL,
    name: settings.siteName,
    description: settings.defaultDescription,
    publisher: { "@id": ORGANIZATION_ID },
    inLanguage: "en",
    potentialAction,
  });
}

export interface Breadcrumb {
  name: string;
  path: string;
}

export function buildBreadcrumbSchema(trail: Breadcrumb[], settings: SeoSettings): JsonLd | null {
  if (!settings.schemaBreadcrumbs || trail.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Product + Offer + Brand.
 *
 * `availability` is derived from real inventory rather than hardcoded to
 * InStock, and the offer's price is the list (net-60) price — the same
 * pre-checkout reference figure the catalogue shows. Terms discounts are
 * negotiated per account and have no business in public markup.
 *
 * Returns null when the product schema switch is off, so an admin can disable
 * it wholesale if Search Console ever objects to marking up a gated page.
 */
export function buildProductSchema(
  style: Style,
  settings: SeoSettings,
  options: { imageUrls?: string[]; inStock?: boolean } = {},
): JsonLd | null {
  if (!settings.schemaProduct) return null;

  const source: ProductSeoSource = {
    name: style.name,
    styleNumber: style.styleNumber,
    category: style.category,
    season: style.season,
    tagline: style.tagline,
    description: style.description,
    brandName: style.brandName,
    materials: style.materials,
    tags: style.tags,
  };

  const images = (options.imageUrls ?? []).filter(Boolean).map(absoluteUrl);
  const availability =
    options.inStock === undefined
      ? undefined
      : options.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock";

  const offer = compact({
    "@type": "Offer",
    url: absoluteUrl(`/product/${style.slug}`),
    priceCurrency: style.currency || "EUR",
    price: style.basePrice > 0 ? style.basePrice.toFixed(2) : undefined,
    availability,
    // Wholesale: the buyer is a business, and the offer is only valid for
    // approved trade accounts. Saying so in the markup is more accurate than
    // implying a consumer-facing price.
    eligibleCustomerType: "https://schema.org/BusinessCustomer",
    seller: { "@id": ORGANIZATION_ID },
  });

  const additionalProperty = [
    style.season ? { "@type": "PropertyValue", name: "Season", value: style.season } : null,
    style.materials?.length
      ? { "@type": "PropertyValue", name: "Materials", value: style.materials.join(", ") }
      : null,
    style.lastNote ? { "@type": "PropertyValue", name: "Last", value: style.lastNote } : null,
  ].filter(Boolean);

  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    name: style.name,
    description: style.metaDescription?.trim() || generateProductDescription(source),
    sku: style.styleNumber,
    mpn: style.mpn,
    gtin: style.gtin,
    gtin13: style.barcode,
    category: style.category,
    material: style.materials?.join(", "),
    image: images,
    url: absoluteUrl(`/product/${style.slug}`),
    brand: { "@type": "Brand", name: style.brandName || settings.siteName },
    manufacturer: { "@id": ORGANIZATION_ID },
    weight: style.weightOz ? { "@type": "QuantitativeValue", value: style.weightOz, unitCode: "ONZ" } : undefined,
    offers: offer,
    additionalProperty: additionalProperty.length ? additionalProperty : undefined,
    // Deliberately no aggregateRating / review — this app collects neither, and
    // Google's policy requires rating markup to reflect real user ratings.
  });
}

export interface CollectionItem {
  name: string;
  path: string;
  imageUrl?: string;
}

/**
 * CollectionPage wrapping an ItemList — the correct pairing for a category or
 * collection listing. A bare ItemList loses the "this page is a listing"
 * signal; a bare CollectionPage loses the members.
 */
export function buildCollectionSchema({
  name,
  description,
  path,
  items,
}: {
  name: string;
  description: string;
  path: string;
  items: CollectionItem[];
}): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
        ...(item.imageUrl ? { image: absoluteUrl(item.imageUrl) } : {}),
      })),
    },
  });
}

export function buildFaqSchema(items: { q: string; a: string }[], settings: SeoSettings): JsonLd | null {
  if (!settings.schemaFaq || items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function buildBrandSchema(brand: { name: string; description?: string; logoUrl?: string; path: string }): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description: brand.description,
    logo: brand.logoUrl ? absoluteUrl(brand.logoUrl) : undefined,
    url: absoluteUrl(brand.path),
  });
}

/**
 * The site-wide graph (Organization + WebSite), emitted once from the root
 * layout. Page-specific schemas are emitted by the pages themselves and
 * reference these by `@id`.
 */
export async function buildSiteSchemas(): Promise<JsonLd[]> {
  const settings = await getSeoSettings();
  return [buildOrganizationSchema(settings), buildWebsiteSchema(settings)].filter(
    (schema): schema is JsonLd => schema !== null,
  );
}
