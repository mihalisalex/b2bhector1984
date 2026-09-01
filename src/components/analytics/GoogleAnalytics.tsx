"use client";

import Script from "next/script";
import { useConsent } from "@/components/analytics/ConsentProvider";

/**
 * GA4 measurement ID. Public by design — it ships in the page source of every site that
 * uses it, so there is nothing to hide in an env var. One property covers both domains;
 * split them by hostname inside GA rather than by running two tags.
 */
export const GA_MEASUREMENT_ID = "G-GDV45R4P8D";

/**
 * Google Analytics, loaded only after the visitor has said yes.
 *
 * The gate is the absence of the script, not Google Consent Mode. Consent Mode would load
 * gtag.js immediately and have it send cookieless pings until permission arrives; this
 * loads nothing at all, sets no cookies and makes no requests to Google until `grant()` has
 * been called. It is the stricter reading of the ePrivacy rules, and — the reason it was
 * chosen here — it is the one that can be proved by looking: no script tag, no `_ga`, no
 * request to google-analytics.com.
 *
 * Rendering is also held until `ready`, so a visitor who accepted on a previous visit does
 * not get a frame with analytics switched off, and one who declined never gets a frame with
 * it switched on.
 *
 * `afterInteractive` keeps it out of the critical path once it does load — the homepage LCP
 * was tuned to 2.1s in August and a third-party script in front of the hero undoes that.
 *
 * NOT rendered in the admin layout: counting the team's own sessions as traffic is how
 * analytics starts lying.
 */
export function GoogleAnalytics() {
  const { consent, ready } = useConsent();
  if (!ready || consent !== "granted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}');`}
      </Script>
    </>
  );
}
