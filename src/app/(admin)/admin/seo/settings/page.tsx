import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import { getSeoSettings, getSeoSettingsForLocale } from "@/lib/data/seoSettings";
import { SeoSettingsForm } from "@/components/admin/seo/SeoSettingsForm";

type Section = "general" | "indexing" | "organization" | "schema";
const SECTIONS: Section[] = ["general", "indexing", "organization", "schema"];
const LOCALES = ["en", "el", "de", "fr"];

export default async function SeoSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string; locale?: string }>;
}) {
  const { section, locale: localeParam } = await searchParams;
  // Unknown or absent -> English. English is the fallback every other locale falls back to,
  // so it is the only safe default to land on.
  const locale = LOCALES.includes(localeParam ?? "") ? localeParam! : "en";

  const [settings, localeSettings, account] = await Promise.all([
    getSeoSettings(),
    getSeoSettingsForLocale(locale),
    getCurrentAccount(),
  ]);
  // The layout above already redirects non-admins; this only decides whether
  // the fields are editable or read-only.
  const canEdit = await hasPermission(account?.adminRole, "products.seo");

  const initialSection = SECTIONS.includes(section as Section) ? (section as Section) : "general";

  return (
    <SeoSettingsForm
      // Remount on locale switch: the SERP preview keeps the title and description in
      // controlled state seeded from props, and React would otherwise keep the previous
      // language's text in the preview while the inputs showed the new one.
      key={locale}
      settings={settings}
      localeSettings={localeSettings}
      locale={locale}
      canEdit={canEdit}
      initialSection={initialSection}
    />
  );
}
