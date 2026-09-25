// Cached public version of the live page — see src/app/[lang]/public/layout.tsx.
import MarketingLayout from "@/app/[lang]/(marketing)/layout";
import { asPublic } from "@/lib/publicRoute";

export default function PublicMarketingLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  return <MarketingLayout params={asPublic(params)}>{children}</MarketingLayout>;
}
