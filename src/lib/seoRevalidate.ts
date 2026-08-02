import "server-only";
import { revalidatePath } from "next/cache";

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
  revalidatePath("/robots.txt");
  revalidatePath("/sitemap.xml");
  // Metadata (canonicals, titles, JSON-LD) is baked into every rendered page,
  // so a settings change has to invalidate the layout too.
  revalidatePath("/", "layout");
}
