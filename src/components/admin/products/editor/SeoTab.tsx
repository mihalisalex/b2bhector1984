"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { updateSeoAction } from "@/lib/productActions";
import { SITE_URL } from "@/lib/siteUrl";
import { useToastResult } from "@/components/ui/ToastProvider";
import { SelectField, TextAreaField, TextField, SaveBar } from "@/components/admin/products/editor/FormField";
import { SerpPreview, SocialPreview, StructuredDataPreview } from "@/components/admin/seo/SeoPreviews";
import {
  containsKeyword,
  generateFocusKeyword,
  generateProductDescription,
  generateProductTitle,
  generateSecondaryKeywords,
  slugifyForSeo,
  type ProductSeoSource,
} from "@/lib/seoAutogen";
import type { FormState } from "@/lib/actions";
import type { StyleImage } from "@/lib/data/styleImages";
import type { Style } from "@/lib/types";

const initialState: FormState = {};

export function SeoTab({
  style,
  images,
  slugHistory,
  commerceIndexable,
  canEdit,
}: {
  style: Style;
  images: StyleImage[];
  slugHistory: { slug: string; isCurrent: boolean; createdAt: string }[];
  commerceIndexable: boolean;
  canEdit: boolean;
}) {
  const action = updateSeoAction.bind(null, style.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
  }, [state, showResult]);

  const source: ProductSeoSource = useMemo(
    () => ({
      name: style.name,
      styleNumber: style.styleNumber,
      category: style.category,
      season: style.season,
      tagline: style.tagline,
      description: style.description,
      brandName: style.brandName,
      materials: style.materials,
      tags: style.tags,
      colorwayNames: style.colorways.map((colorway) => colorway.name),
    }),
    [style],
  );

  // The generated values are computed with exactly the same functions the
  // server uses when a field is left blank, so the preview below can never
  // disagree with what actually ships.
  const generated = useMemo(
    () => ({
      title: generateProductTitle(source, "Hector Footwear"),
      description: generateProductDescription(source),
      focusKeyword: generateFocusKeyword(source),
      secondaryKeywords: generateSecondaryKeywords(source).join(", "),
    }),
    [source],
  );

  const [seoTitle, setSeoTitle] = useState(style.seoTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(style.metaDescription ?? "");
  const [focusKeyword, setFocusKeyword] = useState(style.focusKeyword ?? "");
  const [slug, setSlug] = useState(style.slug);
  const [ogImageUrl, setOgImageUrl] = useState(style.ogImageUrl ?? style.primaryImageUrl ?? "");
  const [twitterCard, setTwitterCard] = useState(style.twitterCard);

  const effectiveTitle = seoTitle.trim() || generated.title;
  const effectiveDescription = metaDescription.trim() || generated.description;
  const slugChanged = slug !== style.slug;

  const structuredData = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "Product",
      name: style.name,
      description: effectiveDescription,
      sku: style.styleNumber,
      ...(style.mpn ? { mpn: style.mpn } : {}),
      ...(style.gtin ? { gtin: style.gtin } : {}),
      category: style.category,
      ...(style.materials.length ? { material: style.materials.join(", ") } : {}),
      image: images.length ? images.map((image) => image.publicUrl) : [style.primaryImageUrl].filter(Boolean),
      url: `${SITE_URL}/product/${slug}`,
      brand: { "@type": "Brand", name: style.brandName || "Hector Footwear" },
      offers: {
        "@type": "Offer",
        url: `${SITE_URL}/product/${slug}`,
        priceCurrency: style.currency || "EUR",
        price: style.basePrice.toFixed(2),
        eligibleCustomerType: "https://schema.org/BusinessCustomer",
      },
    }),
    [style, effectiveDescription, images, slug],
  );

  const missingAlt = images.filter((image) => !image.altText.trim()).length;

  return (
    <form action={formAction} className="max-w-3xl space-y-6 pb-20">
      {!commerceIndexable && (
        <div className="border border-stone-300 bg-stone-50 px-4 py-3 text-xs text-ink-soft">
          <p className="font-semibold text-ink">This page is not indexed by search engines.</p>
          <p className="mt-1">
            The trade catalogue is private, so every product page is disallowed in robots.txt and
            serves <code className="font-mono-tab">noindex</code>. These fields still matter: they
            control the title, description and image that appear when a rep shares this product&rsquo;s
            link by email, WhatsApp or Slack. Indexing policy lives in{" "}
            <Link href="/admin/seo/settings?section=indexing" className="underline underline-offset-2">
              SEO settings
            </Link>
            .
          </p>
        </div>
      )}

      {/* ---- URL ---------------------------------------------------------- */}
      <fieldset className="space-y-3 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">URL</legend>
        <div>
          <label htmlFor="slug" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Slug
          </label>
          <div className="flex items-center gap-1">
            <span className="font-mono-tab text-xs text-ink-soft">/product/</span>
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              onBlur={() => setSlug((current) => slugifyForSeo(current))}
              disabled={!canEdit}
              className="flex-1 border border-stone-300 bg-white px-3 py-2 font-mono-tab text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
            />
          </div>
          {slugChanged && (
            <p className="mt-2 border border-signal bg-signal/5 px-3 py-2 text-xs text-ink">
              Saving will move this product to{" "}
              <span className="font-mono-tab">/product/{slugifyForSeo(slug) || "…"}</span> and create a
              permanent 301 from <span className="font-mono-tab">/product/{style.slug}</span>, so
              existing links keep working.
            </p>
          )}
          <button
            type="button"
            onClick={() => setSlug(slugifyForSeo(style.name))}
            disabled={!canEdit}
            className="mt-2 text-xs underline underline-offset-2 hover:text-ink disabled:opacity-40"
          >
            Rebuild from product name
          </button>
        </div>

        {slugHistory.filter((entry) => !entry.isCurrent).length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Previous URLs</p>
            <ul className="mt-1 space-y-0.5">
              {slugHistory
                .filter((entry) => !entry.isCurrent)
                .map((entry) => (
                  <li key={entry.slug} className="font-mono-tab text-xs text-ink-soft">
                    /product/{entry.slug}
                    <span className="ml-2 font-sans">
                      → redirects here since {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </fieldset>

      {/* ---- Search result ------------------------------------------------ */}
      <div>
        <label htmlFor="seoTitle" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          SEO title
        </label>
        <input
          id="seoTitle"
          name="seoTitle"
          value={seoTitle}
          onChange={(event) => setSeoTitle(event.target.value)}
          placeholder={generated.title}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
        <BlankFieldHint isBlank={!seoTitle.trim()} generated={generated.title} onUse={() => setSeoTitle(generated.title)} canEdit={canEdit} />
      </div>

      <div>
        <label htmlFor="metaDescription" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Meta description
        </label>
        <textarea
          id="metaDescription"
          name="metaDescription"
          rows={3}
          value={metaDescription}
          onChange={(event) => setMetaDescription(event.target.value)}
          placeholder={generated.description}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
        <BlankFieldHint
          isBlank={!metaDescription.trim()}
          generated={generated.description}
          onUse={() => setMetaDescription(generated.description)}
          canEdit={canEdit}
        />
      </div>

      <SerpPreview title={effectiveTitle} description={effectiveDescription} path={`/product/${slug}`} />

      {/* ---- Keywords ------------------------------------------------------ */}
      <fieldset className="space-y-3 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Keywords</legend>
        <div>
          <label htmlFor="focusKeyword" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Focus keyword
          </label>
          <input
            id="focusKeyword"
            name="focusKeyword"
            value={focusKeyword}
            onChange={(event) => setFocusKeyword(event.target.value)}
            placeholder={generated.focusKeyword}
            disabled={!canEdit}
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
          />
          {focusKeyword.trim() && (
            <ul className="mt-2 space-y-1 text-xs">
              <KeywordCheck ok={containsKeyword(effectiveTitle, focusKeyword)} label="appears in the SEO title" />
              <KeywordCheck ok={containsKeyword(effectiveDescription, focusKeyword)} label="appears in the meta description" />
              <KeywordCheck ok={containsKeyword(slug.replace(/-/g, " "), focusKeyword)} label="appears in the URL slug" />
            </ul>
          )}
        </div>

        <TextField
          label="Secondary keywords (comma-separated)"
          name="secondaryKeywords"
          defaultValue={style.secondaryKeywords.length ? style.secondaryKeywords.join(", ") : ""}
          placeholder={generated.secondaryKeywords}
          disabled={!canEdit}
        />
        <TextField
          label="Legacy keywords field (kept for imports)"
          name="seoKeywords"
          defaultValue={style.seoKeywords.join(", ")}
          disabled={!canEdit}
        />
      </fieldset>

      {/* ---- Indexing ------------------------------------------------------ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Canonical URL"
          name="canonicalUrl"
          defaultValue={style.canonicalUrl}
          disabled={!canEdit}
          placeholder={`/product/${slug}`}
        />
        <SelectField
          label="Robots"
          name="robots"
          defaultValue={style.robots}
          disabled={!canEdit}
          options={[
            { value: "index,follow", label: "Index, Follow" },
            { value: "noindex,follow", label: "No Index, Follow" },
            { value: "index,nofollow", label: "Index, No Follow" },
            { value: "noindex,nofollow", label: "No Index, No Follow" },
          ]}
        />
      </div>
      {!commerceIndexable && (
        <p className="-mt-3 text-xs text-ink-soft">
          The robots setting above is overridden to <code className="font-mono-tab">noindex,nofollow</code>{" "}
          while the trade catalogue is private. It takes effect if that policy is ever changed.
        </p>
      )}

      {/* ---- Social -------------------------------------------------------- */}
      <fieldset className="space-y-4 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Open Graph</legend>
        <TextField label="OG title" name="ogTitle" defaultValue={style.ogTitle} placeholder={effectiveTitle} disabled={!canEdit} />
        <TextAreaField label="OG description" name="ogDescription" defaultValue={style.ogDescription} rows={2} disabled={!canEdit} />
        <div>
          <label htmlFor="ogImageUrl" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            OG image URL
          </label>
          <input
            id="ogImageUrl"
            name="ogImageUrl"
            value={ogImageUrl}
            onChange={(event) => setOgImageUrl(event.target.value)}
            disabled={!canEdit}
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
          />
          {images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {images.slice(0, 6).map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setOgImageUrl(image.publicUrl)}
                  disabled={!canEdit}
                  title={image.altText || "Product photo"}
                  className={`h-12 w-12 border bg-cover bg-center ${
                    ogImageUrl === image.publicUrl ? "border-ink ring-1 ring-ink" : "border-stone-300"
                  }`}
                  style={{ backgroundImage: `url("${image.publicUrl.replace(/"/g, "%22")}")` }}
                >
                  <span className="sr-only">Use this photo as the share image</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-4 border border-stone-300 bg-white p-4">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">X / Twitter</legend>
        <p className="text-xs text-ink-soft">Leave blank to reuse the Open Graph values.</p>
        <TextField label="Twitter title" name="twitterTitle" defaultValue={style.twitterTitle} disabled={!canEdit} />
        <TextAreaField label="Twitter description" name="twitterDescription" defaultValue={style.twitterDescription} rows={2} disabled={!canEdit} />
        <TextField label="Twitter image URL" name="twitterImageUrl" defaultValue={style.twitterImageUrl} disabled={!canEdit} />
        <div>
          <label htmlFor="twitterCard" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
            Card type
          </label>
          <select
            id="twitterCard"
            name="twitterCard"
            value={twitterCard}
            onChange={(event) => setTwitterCard(event.target.value)}
            disabled={!canEdit}
            className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
          >
            <option value="summary_large_image">Summary, large image</option>
            <option value="summary">Summary</option>
          </select>
        </div>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-2">
        <SocialPreview
          network="Open Graph"
          title={style.ogTitle || effectiveTitle}
          description={style.ogDescription || effectiveDescription}
          imageUrl={ogImageUrl || undefined}
        />
        <SocialPreview
          network="X / Twitter"
          card={twitterCard}
          title={style.twitterTitle || style.ogTitle || effectiveTitle}
          description={style.twitterDescription || style.ogDescription || effectiveDescription}
          imageUrl={style.twitterImageUrl || ogImageUrl || undefined}
        />
      </div>

      {/* ---- Images -------------------------------------------------------- */}
      {images.length > 0 && missingAlt > 0 && (
        <div className="border border-signal bg-signal/5 px-4 py-3 text-xs text-ink">
          <strong>{missingAlt}</strong> of {images.length} photos have no alt text. Add it on the{" "}
          <em>Images &amp; Media</em> tab, or generate it for the whole catalogue from{" "}
          <Link href="/admin/seo/bulk" className="underline underline-offset-2">
            SEO bulk tools
          </Link>
          .
        </div>
      )}

      <StructuredDataPreview schema={structuredData} testUrl={`${SITE_URL}/product/${slug}`} />

      {canEdit && <SaveBar isPending={isPending} label="Save SEO" />}
    </form>
  );
}

/**
 * Shown under a blank field. The point is to make clear that blank does NOT
 * mean empty — a generated value ships — and to offer one click to adopt it as
 * real, reviewed copy.
 */
function BlankFieldHint({
  isBlank,
  generated,
  onUse,
  canEdit,
}: {
  isBlank: boolean;
  generated: string;
  onUse: () => void;
  canEdit: boolean;
}) {
  if (!isBlank) return null;
  return (
    <p className="mt-1 text-xs text-ink-soft">
      Blank — the auto-generated value shown above will be used.{" "}
      {canEdit && (
        <button type="button" onClick={onUse} className="underline underline-offset-2 hover:text-ink">
          Use it as a starting point
        </button>
      )}
      {generated.length > 0 && !canEdit && <span className="italic"> &ldquo;{generated}&rdquo;</span>}
    </p>
  );
}

function KeywordCheck({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={ok ? "text-positive" : "text-ink-soft"}>
      <span aria-hidden="true">{ok ? "✓" : "○"}</span> <span>Focus keyword {ok ? "" : "does not "}{label}</span>
    </li>
  );
}
