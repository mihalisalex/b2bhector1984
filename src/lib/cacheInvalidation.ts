import "server-only";
import { updateTag } from "next/cache";
import { CACHE_TAGS, type CacheTag } from "@/lib/cacheTags";

/**
 * Drops the cross-request cache for one or more storefront read paths.
 *
 * Kept separate from `@/lib/cacheTags` on purpose: the data layer imports the tag constants,
 * and this keeps `next/cache`'s revalidation machinery out of that import graph.
 *
 * Uses `updateTag`, not `revalidateTag`, and the difference is the admin's experience:
 * `revalidateTag(tag, "max")` marks the entry stale and serves the *old* value while
 * refreshing in the background, so an admin who just saved the hero would reload and see
 * their previous copy — indistinguishable from the save having failed. `updateTag` expires
 * immediately, giving read-your-own-writes.
 *
 * The tradeoff is that `updateTag` may only be called from a Server Action; it throws in
 * route handlers and during render. Every current caller is a Server Action, which is the
 * natural place for this anyway — invalidation belongs next to the write that caused it.
 */
export function invalidateCache(...tags: CacheTag[]): void {
  for (const tag of tags) updateTag(tag);
}

/**
 * The catalog changed (a product, colorway, image, document, or a bulk import).
 *
 * Note this deliberately does not also invalidate `seasons`: `getAllStyles` is tagged with
 * both, so dropping `styles` alone is enough to rebuild the filtered list.
 */
export function invalidateCatalog(): void {
  invalidateCache(CACHE_TAGS.styles);
}
