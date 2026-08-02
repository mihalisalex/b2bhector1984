import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import { getAllStyles } from "@/lib/data/styles";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { generateProductDescription, generateProductTitle } from "@/lib/seoAutogen";
import { BulkSeoTools, type BulkProductRow } from "@/components/admin/seo/BulkSeoTools";

export default async function SeoBulkPage() {
  const [styles, settings, account] = await Promise.all([getAllStyles(), getSeoSettings(), getCurrentAccount()]);
  const canEdit = await hasPermission(account?.adminRole, "products.seo");

  // Each row carries the *effective* value — the admin's own text when set,
  // otherwise the generated fallback — plus a flag saying which it is, so the
  // table can tell the two apart honestly instead of showing blanks.
  const products: BulkProductRow[] = styles.map((style) => {
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
    return {
      id: style.id,
      styleNumber: style.styleNumber,
      name: style.name,
      category: style.category,
      slug: style.slug,
      seoTitle: style.seoTitle?.trim() || generateProductTitle(source, settings.siteName),
      metaDescription: style.metaDescription?.trim() || generateProductDescription(source),
      focusKeyword: style.focusKeyword ?? "",
      robots: style.robots,
      canonicalUrl: style.canonicalUrl ?? "",
      hasCustomTitle: Boolean(style.seoTitle?.trim()),
      hasCustomDescription: Boolean(style.metaDescription?.trim()),
    };
  });

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm text-ink-soft">
        Catalogue-wide SEO operations. Italicised values marked <em>(auto)</em> are generated
        fallbacks — they ship, but nobody has reviewed them.
      </p>
      <BulkSeoTools products={products} canEdit={canEdit} />
    </div>
  );
}
