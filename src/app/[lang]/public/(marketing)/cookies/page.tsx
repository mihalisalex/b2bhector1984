// Cached public version of the live page — see src/app/[lang]/public/layout.tsx.
import Page, { generateMetadata as pageMetadata } from "@/app/[lang]/(marketing)/cookies/page";
import { asPublic } from "@/lib/publicRoute";

type Props = { params: Promise<{ lang: string }> };

export default function PublicPage({ params }: Props) {
  return <Page params={asPublic(params)} />;
}

export function generateMetadata({ params }: Props) {
  return pageMetadata({ params: asPublic(params) });
}
