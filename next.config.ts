import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const nextConfig: NextConfig = {
  // Default is 1MB, too small for real (unedited) photo uploads from the
  // admin hero/style-image forms — a phone or camera JPEG routinely exceeds it.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    /**
     * DO NOT enable `experimental.inlineCss` here. It was tried and measured on 2026-08-13
     * and it makes this site materially slower, despite being the textbook fix for the
     * "render-blocking requests" insight Lighthouse reports against our one stylesheet.
     *
     * A/B, same commit, two production builds, Lighthouse 13.4.1 against localhost so the
     * network and throttling were identical:
     *
     *            Performance    LCP      Speed Index   render-blocking audit
     *   off          97         2.6 s      1.1 s            fails
     *   on           88         3.9 s      1.7 s            passes
     *
     * It clears the audit and costs 1.3s of LCP. Inlining moved 14.7 KiB of CSS into the
     * document, and because the styles are also duplicated into the RSC payload the gzipped
     * first-visit HTML went 15 KB -> 52 KB. The hero image's <link rel=preload> then sits
     * behind all of that, so the browser discovers the LCP image later than it did when the
     * CSS was a separate parallel request. Trading one round trip for +22 KB on the critical
     * path is a bad deal at this page's size.
     *
     * The lesson generalises: this insight is a heuristic, not a measurement. If you want to
     * attack render-blocking CSS here, do it by shrinking the stylesheet, not by inlining it.
     */
  },
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
