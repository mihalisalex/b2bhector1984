"use client";

/**
 * Resizes product photography through Supabase instead of Vercel.
 *
 * WHY: Vercel's image optimizer started returning 402
 * (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED) once this project's plan ran out of image
 * transformations, so `/_next/image` began failing for any photo not already in its cache.
 * Photos that had been transformed before kept working, which is why only *some* pictures
 * broke — a confusing symptom for something that is a quota, not a bug.
 *
 * Supabase Storage has its own transformer on the same object, one path segment away:
 *
 *   /storage/v1/object/public/<bucket>/<path>      original
 *   /storage/v1/render/image/public/<bucket>/<path>?width=&quality=
 *
 * Measured on 5195 Taba: 292 KB original, 61 KB at width=640. So the resizing that
 * next/image was doing still happens; it happens somewhere that isn't metered by Vercel.
 *
 * Everything that is not a Supabase storage object is returned untouched — the 1984
 * storefront photo in /public, and any future local asset. Those are served as-is rather
 * than optimized, which is the same trade `unoptimized` makes and is fine for a handful of
 * static files.
 *
 * NOTE: this replaces Vercel optimization globally, so `remotePatterns` in next.config.ts
 * no longer gates anything for these URLs — a custom loader bypasses that allowlist. The
 * URLs are built here from a fixed host and path shape rather than from anything a user
 * controls, which is what keeps that safe.
 */

const OBJECT_SEGMENT = "/storage/v1/object/public/";
const RENDER_SEGMENT = "/storage/v1/render/image/public/";

export default function supabaseImageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  if (!src.includes(OBJECT_SEGMENT)) return src;

  const [base, existingQuery] = src.split("?");
  const rendered = base.replace(OBJECT_SEGMENT, RENDER_SEGMENT);

  const params = new URLSearchParams(existingQuery);
  params.set("width", String(width));
  params.set("quality", String(quality ?? 75));
  // `resize=contain` keeps the whole shoe in frame. The default crops to fill the requested
  // box, which on a 4/5 product tile would cut the toe or the heel off a wide photo.
  params.set("resize", "contain");

  return `${rendered}?${params.toString()}`;
}
