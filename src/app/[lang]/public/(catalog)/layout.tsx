// Cached public version of the live page — see src/app/[lang]/public/layout.tsx.
import CatalogLayout from "@/app/[lang]/(catalog)/layout";
import { asPublic } from "@/lib/publicRoute";

export default function PublicCatalogLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  return <CatalogLayout params={asPublic(params)}>{children}</CatalogLayout>;
}
