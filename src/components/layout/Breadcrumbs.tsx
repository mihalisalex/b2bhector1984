import Link from "next/link";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Visible breadcrumb trail. Pair with `buildBreadcrumbSchema` (src/lib/seoJsonLd.ts)
 * for the matching JSON-LD — this app had no visual breadcrumb component before,
 * only the structured-data builder (used on product pages for markup alone).
 */
export function Breadcrumbs({ trail, dict }: { trail: { name: string; path: string }[]; dict: Dictionary }) {
  return (
    <nav aria-label={dict.catalog.breadcrumbNav} className="text-xs text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1.5">
        {trail.map((crumb, index) => {
          const isLast = index === trail.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-ink">
                  {crumb.name}
                </span>
              ) : (
                <Link href={crumb.path} className="hover:text-ink hover:underline">
                  {crumb.name}
                </Link>
              )}
              {!isLast && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
