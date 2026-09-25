// Cached public version of the live page — see src/app/[lang]/public/layout.tsx.
import Page, { generateMetadata as pageMetadata } from "@/app/[lang]/(marketing)/collections/[slug]/page";
import { CATEGORY_PAGES } from "@/lib/categoryPages";
import { asPublic } from "@/lib/publicRoute";

type Props = { params: Promise<{ lang: string; slug: string }> };

/** The category pages are known up front, so they are built at deploy time. */
export function generateStaticParams() {
  return CATEGORY_PAGES.map((page) => ({ slug: page.slug }));
}

export default function PublicPage({ params }: Props) {
  return <Page params={asPublic(params)} />;
}

export function generateMetadata({ params }: Props) {
  return pageMetadata({ params: asPublic(params) });
}
