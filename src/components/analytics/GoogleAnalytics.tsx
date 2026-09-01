import Script from "next/script";

/**
 * GA4 measurement ID. Public by design — it ships in the page source of every site that
 * uses it, so there is nothing to hide in an env var. One property covers both domains;
 * split them by hostname inside GA rather than by running two tags.
 */
export const GA_MEASUREMENT_ID = "G-GDV45R4P8D";

/**
 * The Google tag, loaded once from the locale layout so it covers every buyer-facing page
 * on both domains.
 *
 * `afterInteractive` rather than the raw `async` script Google hands you: it still loads on
 * every page, but after hydration, so it cannot compete with the hero image for bandwidth.
 * The homepage's LCP was tuned to 2.1s in August and a render-blocking third-party script
 * is the classic way to lose that.
 *
 * NOT included in the admin layout. That is a separate root layout, and counting your own
 * team's sessions as traffic is how analytics starts lying to you.
 *
 * GA4 tracks App Router client-side navigations on its own — its enhanced measurement
 * listens for History API changes — so there is no route-change handler to write here.
 */
export function GoogleAnalytics() {
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
