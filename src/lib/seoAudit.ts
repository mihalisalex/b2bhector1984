import "server-only";
import { getSeoSettings, isSeoSchemaReady, type SeoSettings } from "@/lib/data/seoSettings";
import { getAllEntityMeta, type SeoEntityMeta } from "@/lib/data/seoEntityMeta";
import { listRedirects, normalizePath, type SeoRedirect } from "@/lib/data/seoRedirects";
import { listAllImagesWithContext } from "@/lib/data/styleImages";
import { getAllStyles } from "@/lib/data/styles";
import { PUBLIC_PAGES } from "@/lib/seoRoutes";
import {
  DESCRIPTION_MAX,
  DESCRIPTION_MIN,
  TITLE_MAX,
  TITLE_MIN,
  containsKeyword,
  generateProductDescription,
  generateProductTitle,
} from "@/lib/seoAutogen";
import type { Style } from "@/lib/types";

/**
 * The SEO audit engine.
 *
 * Every check below runs against data this app actually holds. There is
 * deliberately no "broken external link" or "indexed page count" check: both
 * require either crawling the live site or a Search Console API credential
 * that this project doesn't have, and a number that is silently always zero is
 * worse than an honest absence. The dashboard says so in plain text rather
 * than showing an empty widget that looks like a clean bill of health.
 */

export type IssueSeverity = "critical" | "warning" | "notice";

export type IssueCode =
  | "missing_title"
  | "missing_description"
  | "duplicate_title"
  | "duplicate_description"
  | "title_length"
  | "description_length"
  | "missing_alt_text"
  | "missing_focus_keyword"
  | "keyword_not_in_title"
  | "keyword_not_in_description"
  | "missing_og_image"
  | "no_product_images"
  | "canonical_offsite"
  | "canonical_to_noindex"
  | "slug_quality"
  | "redirect_loop"
  | "redirect_chain"
  | "redirect_to_missing"
  | "indexable_conflict";

export interface SeoIssue {
  code: IssueCode;
  severity: IssueSeverity;
  title: string;
  detail: string;
  /** Where to go to fix it. */
  fixHref?: string;
  entityLabel: string;
}

export interface PageScore {
  id: string;
  label: string;
  path: string;
  kind: "product" | "page";
  score: number;
  issues: SeoIssue[];
  editHref: string;
}

export interface SeoAuditReport {
  generatedAt: string;
  /** 0-100, the mean of every page score. */
  overallScore: number;
  issues: SeoIssue[];
  pages: PageScore[];
  counts: {
    critical: number;
    warning: number;
    notice: number;
    productsAudited: number;
    pagesAudited: number;
    imagesAudited: number;
    imagesMissingAlt: number;
    redirects: number;
    redirectsDisabled: number;
  };
  /** Present when the SEO schema migration hasn't been run — the UI shows a banner instead of a false all-clear. */
  schemaReady: boolean;
}

const SEVERITY_WEIGHT: Record<IssueSeverity, number> = { critical: 25, warning: 10, notice: 3 };

function scoreFor(issues: SeoIssue[]): number {
  const penalty = issues.reduce((sum, issue) => sum + SEVERITY_WEIGHT[issue.severity], 0);
  return Math.max(0, 100 - penalty);
}

/** Groups values by a normalised key so "  FOO " and "foo" count as the same title. */
function duplicatesOf(entries: { key: string; value: string }[]): Map<string, string[]> {
  const byValue = new Map<string, string[]>();
  for (const entry of entries) {
    const normalized = entry.value.trim().toLowerCase();
    if (!normalized) continue;
    const bucket = byValue.get(normalized);
    if (bucket) bucket.push(entry.key);
    else byValue.set(normalized, [entry.key]);
  }
  return new Map([...byValue].filter(([, keys]) => keys.length > 1));
}

function auditProduct(
  style: Style,
  settings: SeoSettings,
  context: {
    duplicateTitles: Set<string>;
    duplicateDescriptions: Set<string>;
    imagesByStyle: Map<string, { altText: string }[]>;
  },
): PageScore {
  const issues: SeoIssue[] = [];
  const editHref = `/admin/products/${style.id}?tab=seo`;
  const label = `${style.styleNumber} · ${style.name}`;
  const path = `/product/${style.slug}`;

  const source = {
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

  const hasManualTitle = Boolean(style.seoTitle?.trim());
  const hasManualDescription = Boolean(style.metaDescription?.trim());
  const title = style.seoTitle?.trim() || generateProductTitle(source, settings.siteName);
  const description = style.metaDescription?.trim() || generateProductDescription(source);

  const add = (
    code: IssueCode,
    severity: IssueSeverity,
    issueTitle: string,
    detail: string,
  ) => issues.push({ code, severity, title: issueTitle, detail, fixHref: editHref, entityLabel: label });

  // A generated fallback is a real fallback, not a pass: it ships, but nobody
  // has reviewed it, so it's a notice rather than a critical.
  if (!hasManualTitle) {
    add("missing_title", "notice", "No SEO title set", "Falling back to an auto-generated title. Review and confirm it.");
  }
  if (!hasManualDescription) {
    add(
      "missing_description",
      "notice",
      "No meta description set",
      "Falling back to auto-generated copy from the tagline. Review and confirm it.",
    );
  }

  if (title.length > TITLE_MAX) {
    add("title_length", "warning", "Title too long", `${title.length} characters — Google truncates around ${TITLE_MAX}.`);
  } else if (title.length < TITLE_MIN) {
    add("title_length", "notice", "Title is short", `${title.length} characters — there's room for more detail.`);
  }

  if (description.length > DESCRIPTION_MAX) {
    add(
      "description_length",
      "warning",
      "Meta description too long",
      `${description.length} characters — Google truncates around ${DESCRIPTION_MAX}.`,
    );
  } else if (description.length < DESCRIPTION_MIN) {
    add(
      "description_length",
      "notice",
      "Meta description is short",
      `${description.length} characters — aim for ${DESCRIPTION_MIN}-${DESCRIPTION_MAX}.`,
    );
  }

  if (context.duplicateTitles.has(title.trim().toLowerCase())) {
    add("duplicate_title", "critical", "Duplicate title", "Another product uses this exact SEO title.");
  }
  if (context.duplicateDescriptions.has(description.trim().toLowerCase())) {
    add("duplicate_description", "critical", "Duplicate meta description", "Another product uses this exact description.");
  }

  const focus = style.focusKeyword?.trim();
  if (!focus) {
    add("missing_focus_keyword", "notice", "No focus keyword", "Set the term this product should rank for.");
  } else {
    if (!containsKeyword(title, focus)) {
      add("keyword_not_in_title", "warning", "Focus keyword missing from title", `"${focus}" doesn't appear in the SEO title.`);
    }
    if (!containsKeyword(description, focus)) {
      add(
        "keyword_not_in_description",
        "notice",
        "Focus keyword missing from description",
        `"${focus}" doesn't appear in the meta description.`,
      );
    }
  }

  const images = context.imagesByStyle.get(style.id) ?? [];
  if (images.length === 0) {
    add(
      "no_product_images",
      "warning",
      "No product photos uploaded",
      "Falls back to the category placeholder. Share cards and the image sitemap have nothing specific to show.",
    );
  } else {
    const missingAlt = images.filter((image) => !image.altText.trim()).length;
    if (missingAlt > 0) {
      add(
        "missing_alt_text",
        "warning",
        "Images missing alt text",
        `${missingAlt} of ${images.length} photos have no alt text.`,
      );
    }
  }

  if (!style.ogImageUrl?.trim() && !style.primaryImageUrl) {
    add("missing_og_image", "notice", "No social share image", "Links shared by reps will unfurl without a photo.");
  }

  const canonical = style.canonicalUrl?.trim();
  if (canonical && /^https?:\/\//i.test(canonical) && !canonical.includes("hector")) {
    add("canonical_offsite", "critical", "Canonical points off-site", `This page hands its ranking to ${canonical}.`);
  }

  // The slug defect this project has shipped for a while: duplication stacks
  // "-copy", and until now nothing could rename it.
  if (/-copy(-copy)*$/.test(style.slug)) {
    add(
      "slug_quality",
      "warning",
      "Slug contains “-copy”",
      `"${style.slug}" came from duplicating another product. Rename it — a redirect is created automatically.`,
    );
  } else if (style.slug.length > 75) {
    add("slug_quality", "notice", "Slug is very long", `${style.slug.length} characters.`);
  }

  if (settings.commerceIndexable && style.robots?.includes("noindex")) {
    add(
      "indexable_conflict",
      "notice",
      "Product set to noindex",
      "The catalogue is public but this product opts out of indexing.",
    );
  }

  return { id: style.id, label, path, kind: "product", score: scoreFor(issues), issues, editHref };
}

function auditPage(
  page: (typeof PUBLIC_PAGES)[number],
  override: SeoEntityMeta | undefined,
  duplicates: { titles: Set<string>; descriptions: Set<string> },
): PageScore {
  const issues: SeoIssue[] = [];
  const editHref = `/admin/seo/pages?page=${encodeURIComponent(page.path)}`;
  const title = override?.seoTitle?.trim() || page.defaultTitle;
  const description = override?.metaDescription?.trim() || page.defaultDescription;

  const add = (code: IssueCode, severity: IssueSeverity, issueTitle: string, detail: string) =>
    issues.push({ code, severity, title: issueTitle, detail, fixHref: editHref, entityLabel: page.label });

  if (!title) add("missing_title", "critical", "No title", "This page has no title at all.");
  if (!description) add("missing_description", "critical", "No meta description", "This page has no description at all.");

  if (title.length > TITLE_MAX) {
    add("title_length", "warning", "Title too long", `${title.length} characters — Google truncates around ${TITLE_MAX}.`);
  }
  if (description.length > DESCRIPTION_MAX) {
    add(
      "description_length",
      "warning",
      "Meta description too long",
      `${description.length} characters — Google truncates around ${DESCRIPTION_MAX}.`,
    );
  } else if (description.length < DESCRIPTION_MIN) {
    add("description_length", "notice", "Meta description is short", `${description.length} characters.`);
  }

  if (duplicates.titles.has(title.trim().toLowerCase())) {
    add("duplicate_title", "critical", "Duplicate title", "Another public page uses this exact title.");
  }
  if (duplicates.descriptions.has(description.trim().toLowerCase())) {
    add("duplicate_description", "critical", "Duplicate meta description", "Another public page uses this description.");
  }

  if (override?.robots?.includes("noindex")) {
    add(
      "indexable_conflict",
      "warning",
      "Public page set to noindex",
      "This page is in robots.txt's allow list but opts out of indexing. It's excluded from the sitemap.",
    );
  }

  return {
    id: page.path,
    label: page.label,
    path: page.path,
    kind: "page",
    score: scoreFor(issues),
    issues,
    editHref,
  };
}

/** Redirect-table hygiene: loops, chains, and rules pointing at nothing. */
function auditRedirects(redirects: SeoRedirect[], knownPaths: Set<string>): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const active = redirects.filter((redirect) => redirect.enabled);
  const byFrom = new Map(active.map((redirect) => [normalizePath(redirect.fromPath), normalizePath(redirect.toPath)]));

  for (const redirect of active) {
    const from = normalizePath(redirect.fromPath);
    const to = normalizePath(redirect.toPath);
    const label = `${redirect.fromPath} → ${redirect.toPath}`;
    const fixHref = "/admin/seo/redirects";

    if (/^https?:\/\//i.test(to)) continue;

    // Loop detection, bounded.
    const seen = new Set<string>([from]);
    let cursor = to;
    let looped = false;
    let hops = 0;
    while (byFrom.has(cursor)) {
      if (seen.has(cursor)) {
        looped = true;
        break;
      }
      seen.add(cursor);
      cursor = byFrom.get(cursor)!;
      if (++hops > 25) {
        looped = true;
        break;
      }
    }

    if (looped) {
      issues.push({
        code: "redirect_loop",
        severity: "critical",
        title: "Redirect loop",
        detail: `${label} eventually redirects back to itself. Visitors get ERR_TOO_MANY_REDIRECTS.`,
        fixHref,
        entityLabel: label,
      });
      continue;
    }

    if (cursor !== to) {
      issues.push({
        code: "redirect_chain",
        severity: "warning",
        title: "Redirect chain",
        detail: `${label}, which then redirects to ${cursor}. Point it straight at the final destination.`,
        fixHref,
        entityLabel: label,
      });
    }

    // Only flag destinations we can actually verify — product URLs and the
    // known public pages. Anything else may legitimately exist.
    const verifiable = cursor.startsWith("/product/") || cursor === "/" || PUBLIC_PAGES.some((p) => p.path === cursor);
    if (verifiable && !knownPaths.has(cursor)) {
      issues.push({
        code: "redirect_to_missing",
        severity: "critical",
        title: "Redirect points at a missing page",
        detail: `${label} — the destination doesn't exist, so visitors land on a 404.`,
        fixHref,
        entityLabel: label,
      });
    }
  }

  return issues;
}

export async function runSeoAudit(): Promise<SeoAuditReport> {
  const [settings, styles, images, redirects, overrides, schemaReady] = await Promise.all([
    getSeoSettings(),
    getAllStyles(),
    listAllImagesWithContext(),
    listRedirects(),
    getAllEntityMeta(),
    isSeoSchemaReady(),
  ]);

  const imagesByStyle = new Map<string, { altText: string }[]>();
  for (const image of images) {
    const bucket = imagesByStyle.get(image.styleId);
    if (bucket) bucket.push({ altText: image.altText });
    else imagesByStyle.set(image.styleId, [{ altText: image.altText }]);
  }

  // Duplicate detection has to run across the whole set before any single page
  // can be judged, so it happens here rather than inside auditProduct.
  const productTitles = styles.map((style) => ({
    key: style.id,
    value:
      style.seoTitle?.trim() ||
      generateProductTitle(
        {
          name: style.name,
          category: style.category,
          season: style.season,
          tagline: style.tagline,
          brandName: style.brandName,
        },
        settings.siteName,
      ),
  }));
  const productDescriptions = styles.map((style) => ({
    key: style.id,
    value:
      style.metaDescription?.trim() ||
      generateProductDescription({
        name: style.name,
        category: style.category,
        season: style.season,
        tagline: style.tagline,
        description: style.description,
        materials: style.materials,
      }),
  }));

  const duplicateTitles = new Set(duplicatesOf(productTitles).keys());
  const duplicateDescriptions = new Set(duplicatesOf(productDescriptions).keys());

  const pageTitleEntries = PUBLIC_PAGES.map((page) => ({
    key: page.path,
    value: overrides.get(`page:${page.path}`)?.seoTitle?.trim() || page.defaultTitle,
  }));
  const pageDescriptionEntries = PUBLIC_PAGES.map((page) => ({
    key: page.path,
    value: overrides.get(`page:${page.path}`)?.metaDescription?.trim() || page.defaultDescription,
  }));
  const pageDuplicates = {
    titles: new Set(duplicatesOf(pageTitleEntries).keys()),
    descriptions: new Set(duplicatesOf(pageDescriptionEntries).keys()),
  };

  const productScores = styles.map((style) =>
    auditProduct(style, settings, { duplicateTitles, duplicateDescriptions, imagesByStyle }),
  );
  const pageScores = PUBLIC_PAGES.map((page) => auditPage(page, overrides.get(`page:${page.path}`), pageDuplicates));

  const knownPaths = new Set<string>([
    ...PUBLIC_PAGES.map((page) => page.path),
    ...styles.map((style) => `/product/${style.slug}`),
  ]);
  const redirectIssues = auditRedirects(redirects, knownPaths);

  const pages = [...pageScores, ...productScores];
  const issues = [...redirectIssues, ...pages.flatMap((page) => page.issues)];

  const order: Record<IssueSeverity, number> = { critical: 0, warning: 1, notice: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);

  const imagesMissingAlt = images.filter((image) => !image.altText.trim()).length;

  return {
    generatedAt: new Date().toISOString(),
    overallScore: pages.length ? Math.round(pages.reduce((sum, page) => sum + page.score, 0) / pages.length) : 100,
    issues,
    pages: pages.sort((a, b) => a.score - b.score),
    counts: {
      critical: issues.filter((issue) => issue.severity === "critical").length,
      warning: issues.filter((issue) => issue.severity === "warning").length,
      notice: issues.filter((issue) => issue.severity === "notice").length,
      productsAudited: styles.length,
      pagesAudited: PUBLIC_PAGES.length,
      imagesAudited: images.length,
      imagesMissingAlt,
      redirects: redirects.length,
      redirectsDisabled: redirects.filter((redirect) => !redirect.enabled).length,
    },
    schemaReady,
  };
}
