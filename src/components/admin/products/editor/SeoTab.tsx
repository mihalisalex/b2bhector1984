"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { updateSeoAction } from "@/lib/productActions";
import { useToastResult } from "@/components/ui/ToastProvider";
import { TextField, TextAreaField, SelectField, SaveBar } from "@/components/admin/products/editor/FormField";
import type { FormState } from "@/lib/actions";
import type { Style } from "@/lib/types";

const initialState: FormState = {};

export function SeoTab({ style, canEdit }: { style: Style; canEdit: boolean }) {
  const action = updateSeoAction.bind(null, style.id);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const showResult = useToastResult();
  useEffect(() => {
    if (state.error || state.success) showResult(state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const [seoTitle, setSeoTitle] = useState(style.seoTitle ?? `${style.name} — Hector 1984`);
  const [metaDescription, setMetaDescription] = useState(style.metaDescription ?? style.tagline);

  const suggestedKeywords = useMemo(
    () => Array.from(new Set([style.category, style.season, ...style.tags, "wholesale", "footwear"])).join(", "),
    [style.category, style.season, style.tags],
  );

  const structuredDataPreview = useMemo(
    () =>
      JSON.stringify(
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: style.name,
          sku: style.styleNumber,
          brand: { "@type": "Brand", name: style.brandName || "Hector 1984" },
          description: metaDescription,
          offers: { "@type": "Offer", price: style.basePrice, priceCurrency: style.currency, availability: "https://schema.org/InStock" },
        },
        null,
        2,
      ),
    [style, metaDescription],
  );

  return (
    <form action={formAction} className="max-w-3xl space-y-6 pb-20">
      <div>
        <label htmlFor="seoTitle" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">SEO title</label>
        <input
          id="seoTitle"
          name="seoTitle"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
      </div>
      <div>
        <label htmlFor="metaDescription" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft">Meta description</label>
        <textarea
          id="metaDescription"
          name="metaDescription"
          rows={2}
          value={metaDescription}
          onChange={(e) => setMetaDescription(e.target.value)}
          disabled={!canEdit}
          className="w-full border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus-visible:border-signal disabled:bg-stone-100"
        />
      </div>
      <TextField label="Keywords (comma-separated)" name="seoKeywords" defaultValue={style.seoKeywords.length ? style.seoKeywords.join(", ") : suggestedKeywords} disabled={!canEdit} />
      <p className="-mt-3 text-xs text-ink-soft">Slug: <span className="font-mono-tab">/{style.slug}</span> (set at creation, not editable here)</p>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Canonical URL" name="canonicalUrl" defaultValue={style.canonicalUrl} disabled={!canEdit} placeholder={`/product/${style.slug}`} />
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

      <div className="border border-stone-300 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Google search preview</p>
        <p className="mt-2 truncate text-lg text-[#1a0dab]">{seoTitle}</p>
        <p className="text-sm text-[#006621]">hector1984.com › product › {style.slug}</p>
        <p className="text-sm text-[#545454]">{metaDescription}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField label="Open Graph title" name="ogTitle" defaultValue={style.ogTitle ?? seoTitle} disabled={!canEdit} />
        <TextField label="Open Graph image URL" name="ogImageUrl" defaultValue={style.ogImageUrl ?? style.primaryImageUrl} disabled={!canEdit} />
      </div>
      <TextAreaField label="Open Graph description" name="ogDescription" defaultValue={style.ogDescription ?? metaDescription} rows={2} disabled={!canEdit} />
      <SelectField
        label="Twitter card type"
        name="twitterCard"
        defaultValue={style.twitterCard}
        disabled={!canEdit}
        options={[{ value: "summary_large_image", label: "Summary Large Image" }, { value: "summary", label: "Summary" }]}
      />

      <div className="border border-stone-300 bg-white p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Social share preview</p>
        <div className="mt-2 max-w-sm border border-stone-300">
          <div className="aspect-[1.91/1] w-full bg-stone-200" />
          <div className="p-2">
            <p className="truncate text-xs uppercase text-ink-soft">hector1984.com</p>
            <p className="truncate text-sm font-semibold text-ink">{style.ogTitle ?? seoTitle}</p>
            <p className="truncate text-xs text-ink-soft">{style.ogDescription ?? metaDescription}</p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">Structured data (JSON-LD) — auto-generated preview</p>
        <pre className="scroll-thin max-h-56 overflow-auto border border-stone-300 bg-stone-100 p-3 text-xs text-ink-soft">{structuredDataPreview}</pre>
      </div>

      {canEdit && <SaveBar isPending={isPending} />}
    </form>
  );
}
