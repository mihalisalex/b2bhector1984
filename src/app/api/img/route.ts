import sharp from "sharp";
import type { NextRequest } from "next/server";
import { EMAIL_IMAGE_WIDTHS, isStyleImagePath } from "@/lib/campaignEmail";

/**
 * Product photos for emails and admin thumbnails, resized here instead of by Supabase.
 *
 * WHY: Supabase's transformer (/storage/v1/render/image) returns 500 for a share of
 * first-time requests (seen 2026-10-13: 3 of 9 winter photos at once). A browser page can
 * retry; an email can't — Gmail fetches the photo once and a failure stays broken. This
 * reads the ORIGINAL object (plain storage download, reliable), resizes it with sharp and
 * returns a JPEG, which every mail client shows (Outlook on Windows doesn't show WebP).
 *
 * Open on purpose: emails are read without a session. It only serves objects from the
 * public `style-images` bucket — already public — at a fixed set of widths, so it can't be
 * used to resize arbitrary URLs. The response is cached for a year by the CDN.
 */
const SOURCE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/style-images/`;
/** Same light grey as the email's photo cards, behind any transparent pixels. */
const BACKGROUND = "#f4f3f1";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("p") ?? "";
  const width = Number(request.nextUrl.searchParams.get("w"));
  if (!isStyleImagePath(path) || !(EMAIL_IMAGE_WIDTHS as readonly number[]).includes(width)) {
    return new Response("Bad request", { status: 400 });
  }

  const original = await fetch(SOURCE + path.split("/").map(encodeURIComponent).join("/"));
  if (!original.ok) return new Response("Not found", { status: 404 });

  try {
    const jpeg = await sharp(Buffer.from(await original.arrayBuffer()))
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .flatten({ background: BACKGROUND })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch {
    return new Response("Unreadable image", { status: 422 });
  }
}
