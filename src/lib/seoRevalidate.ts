import "server-only";
import { revalidatePath } from "next/cache";
import { invalidateCache } from "@/lib/cacheInvalidation";
import { CACHE_TAGS } from "@/lib/cacheTags";

/**
 * Flushes the cached SEO surfaces.
 *
 * `robots.ts` and `sitemap.ts` both declare `revalidate = 3600`, which is right
 * for ordinary traffic but wrong for an admin who has just changed an indexing
 * policy and wants to check the result. Every SEO mutation calls this so the
 * two files regenerate on the next request instead of up to an hour later.
 *
 * Its own module rather than a helper inside a `"use server"` file: those may
 * only export async functions, and this is deliberately synchronous.
 */
export function revalidateSeoSurfaces(): void {
  // `getSeoSettings` is now cached across requests and read by the root layout's
  // generateMetadata on every page, so the cached row has to go too — otherwise an
  // indexing-policy change would keep serving the old robots/canonical values.
  invalidateCache(CACHE_TAGS.seo);
  revalidatePath("/robots.txt");
  revalidatePath("/sitemap.xml");
  // Metadata (canonicals, titles, JSON-LD) is baked into every rendered page,
  // so a settings change has to invalidate the layout too.
  revalidatePath("/", "layout");
}
