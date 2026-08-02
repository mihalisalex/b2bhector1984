import { getCurrentAccount } from "@/lib/session";
import { hasPermission } from "@/lib/data/permissions";
import { getSeoSettings } from "@/lib/data/seoSettings";
import { SeoSettingsForm } from "@/components/admin/seo/SeoSettingsForm";

type Section = "general" | "indexing" | "organization" | "schema";
const SECTIONS: Section[] = ["general", "indexing", "organization", "schema"];

export default async function SeoSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const [{ section }, settings, account] = await Promise.all([
    searchParams,
    getSeoSettings(),
    getCurrentAccount(),
  ]);
  // The layout above already redirects non-admins; this only decides whether
  // the fields are editable or read-only.
  const canEdit = await hasPermission(account?.adminRole, "products.seo");

  const initialSection = SECTIONS.includes(section as Section) ? (section as Section) : "general";

  return <SeoSettingsForm settings={settings} canEdit={canEdit} initialSection={initialSection} />;
}
