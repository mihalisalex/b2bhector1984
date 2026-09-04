/**
 * Fetches every public route on both domains and asserts each returns 200.
 *
 *   npx tsx scripts/smokeRoutes.ts                    # both production domains
 *   npx tsx scripts/smokeRoutes.ts http://el.localhost:3000
 *
 * WHY THIS EXISTS. Twice now a client-only hook has been used from a server component.
 * Typecheck passes, lint passes, and the page throws at request time — the second instance
 * returned HTTP 500 on every product page, to every logged-out visitor and to Google, and
 * was found by a person looking at the site rather than by any check.
 *
 * This is the missing net, and it is deliberately dumb: no browser, no assertions about
 * content, just "does every page still respond". That is enough to catch a whole class of
 * runtime failure in about twenty seconds.
 *
 * Requests are anonymous, which is the point — the product-page outage only affected the
 * logged-out branch, so a signed-in check would have sailed straight past it.
 *
 * Product and journal slugs are read from the database rather than hardcoded, so the list
 * cannot drift away from the catalogue.
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const STATIC_ROUTES = [
  "/",
  "/catalogue",
  "/collections",
  "/quick-order",
  "/brand-story",
  "/journal",
  "/faq",
  "/contact",
  "/apply",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/cookies",
  "/sitemap.xml",
  "/robots.txt",
];

async function main() {
  const arg = process.argv[2];
  const bases = arg ? [arg.replace(/\/$/, "")] : ["https://www.hectorfootwear.gr", "https://www.hectorfootwear.com"];

  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: styles } = await db.from("styles").select("slug").eq("status", "active").order("slug");
  const { data: posts } = await db.from("journal_posts").select("slug,status").eq("status", "published");

  const routes = [
    ...STATIC_ROUTES,
    // Every product, not a sample. They are the pages that broke, there are only 31, and a
    // sample would have a one-in-three chance of missing a single bad style.
    ...(styles ?? []).map((s) => `/product/${(s as { slug: string }).slug}`),
    ...(posts ?? []).slice(0, 3).map((p) => `/journal/${(p as { slug: string }).slug}`),
  ];

  let failures = 0;
  for (const base of bases) {
    console.log(`\n${base}  (${routes.length} routes)`);
    for (const route of routes) {
      let status = 0;
      let note = "";
      try {
        const res = await fetch(base + route, { redirect: "follow" });
        status = res.status;
      } catch (e) {
        note = String(e).slice(0, 60);
      }
      if (status !== 200) {
        failures++;
        console.log(`  FAIL ${String(status || "ERR").padEnd(4)} ${route}${note ? "  " + note : ""}`);
      }
    }
  }

  if (failures === 0) {
    console.log(`\nAll routes returned 200 on ${bases.length} host(s).`);
    return;
  }
  console.log(`\n${failures} route(s) did not return 200.`);
  process.exitCode = 1;
}

main();
