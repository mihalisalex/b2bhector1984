import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { getAllEntityMeta, type SeoEntityMeta } from "@/lib/data/seoEntityMeta";
import { getAllCollections } from "@/lib/data/collections";
import { getAllBrands } from "@/lib/data/brands";
import { getAllSuppliers } from "@/lib/data/suppliers";
import { getSeasonSettings } from "@/lib/data/seasonSettings";
import { CATEGORY_LABEL } from "@/lib/data/styleLabels";
import { PUBLIC_PAGES } from "@/lib/seoRoutes";
import { EntitySeoEditor, type EntityGroup } from "@/components/admin/seo/EntitySeoEditor";
import type { Category } from "@/lib/types";

const CATEGORIES: Category[] = ["loafers", "wedding", "sneakers", "sandals", "boots", "formal", "anatomic"];

export default async function SeoPagesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [{ page }, settings, overrides, collections, brands, suppliers, seasons, account] = await Promise.all([
    searchParams,
    getSeoSettings(),
    getAllEntityMeta(),
    getAllCollections(),
    getAllBrands(),
    getAllSuppliers(),
    getSeasonSettings(),
    getCurrentAccount(),
  ]);
  const canEdit = await hasPermission(account?.adminRole, "products.seo");

  const groups: EntityGroup[] = [
    {
      heading: "Landing pages",
      blurb: "The seven publicly indexable pages.",
      targets: PUBLIC_PAGES.map((publicPage) => ({
        type: "page" as const,
        key: publicPage.path,
        label: publicPage.label,
        path: publicPage.path,
        defaultTitle: publicPage.defaultTitle,
        defaultDescription: publicPage.defaultDescription,
        gated: false,
      })),
    },
    {
      heading: "Categories",
      blurb: "Filtered catalogue views.",
      targets: CATEGORIES.map((category) => ({
        type: "category" as const,
        key: category,
        label: CATEGORY_LABEL[category],
        path: `/catalogue?category=${category}`,
        defaultTitle: `${CATEGORY_LABEL[category]} — Wholesale`,
        defaultDescription: `Browse the Hector Footwear ${CATEGORY_LABEL[category].toLowerCase()} range. Full-grain leather, box-only wholesale ordering, trade terms.`,
        gated: true,
      })),
    },
    {
      heading: "Seasons",
      blurb: "Seasonal collection views.",
      targets: (["summer", "winter"] as const).map((season) => ({
        type: "season" as const,
        key: season,
        label: seasons[season].label,
        path: `/catalogue?season=${season}`,
        defaultTitle: `${seasons[season].label} Collection — Wholesale`,
        defaultDescription: `The Hector Footwear ${seasons[season].label.toLowerCase()} collection, available to approved wholesale accounts.`,
        gated: true,
      })),
    },
  ];

  // These three are real database rows, so they only appear once something has
  // actually been created — an empty group with no targets would just be noise.
  if (collections.length > 0) {
    groups.push({
      heading: "Collections",
      blurb: "Merchandising groupings.",
      targets: collections.map((collection) => ({
        type: "collection" as const,
        key: collection.id,
        label: collection.name,
        path: `/catalogue?collection=${collection.id}`,
        defaultTitle: `${collection.name} — Hector Footwear`,
        defaultDescription: `The ${collection.name} collection from Hector Footwear, available to approved wholesale accounts.`,
        gated: true,
      })),
    });
  }

  if (brands.length > 0) {
    groups.push({
      heading: "Brands",
      blurb: "Brand landing metadata.",
      targets: brands.map((brand) => ({
        type: "brand" as const,
        key: brand.id,
        label: brand.name,
        path: `/catalogue?brand=${brand.id}`,
        defaultTitle: `${brand.name} — Wholesale`,
        defaultDescription: `${brand.name} footwear, wholesale only. Box-only ordering and trade terms for approved accounts.`,
        gated: true,
      })),
    });
  }

  if (suppliers.length > 0) {
    groups.push({
      heading: "Suppliers",
      blurb: "Internal — not public URLs, but kept here so every entity has one place for its metadata.",
      targets: suppliers.map((supplier) => ({
        type: "supplier" as const,
        key: supplier.id,
        label: supplier.name,
        path: `/admin/suppliers`,
        defaultTitle: supplier.name,
        defaultDescription: `Supplier record for ${supplier.name}.`,
        gated: true,
      })),
    });
  }

  const overrideMap: Record<string, SeoEntityMeta> = {};
  for (const [key, value] of overrides) overrideMap[key] = value;

  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm text-ink-soft">
        Metadata for everything that isn&rsquo;t an individual product. Leave a field blank to keep the
        built-in default — it shows as placeholder text so you can always see what you&rsquo;d be
        replacing. A dot next to a name means it has been customised.
      </p>

      <EntitySeoEditor
        groups={groups}
        overrides={overrideMap}
        canEdit={canEdit}
        commerceIndexable={settings.commerceIndexable}
        initialKey={page}
      />
    </div>
  );
}
