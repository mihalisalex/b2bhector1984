import { config } from "dotenv";
config({ path: ".env.local" });

import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests only — a safety net for the critical paths (login, checkout,
 * admin order edit, account settings), not full coverage. These run against
 * whatever Supabase project .env.local points to (no separate test DB) —
 * the checkout test places a real order and decrements real inventory.
 * Run locally with `npm run test:e2e`; not wired into ci.yml on purpose.
 */

/**
 * The site has been live since 2026-08-03, and `.env.local` on a working machine points
 * at the production Supabase project. `checkout.spec.ts` places a real order and
 * decrements real inventory, so running this suite unguarded corrupts live trading data
 * and pushes a phantom order into a real buyer's history.
 *
 * This refuses to start against the production project unless the operator says so
 * explicitly. It is a guard against muscle memory (`npm run test:e2e` after a change),
 * not against a determined override — that is exactly what it needs to be.
 *
 * To run these safely: point `.env.local` at a seeded test project. To deliberately run
 * against production anyway: `E2E_ALLOW_PRODUCTION=1 npm run test:e2e`.
 */
const PRODUCTION_SUPABASE_REF = "yhtmdrurvthgvekgovcy";
const targetSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

if (targetSupabaseUrl.includes(PRODUCTION_SUPABASE_REF) && process.env.E2E_ALLOW_PRODUCTION !== "1") {
  throw new Error(
    [
      "",
      "Refusing to run the E2E suite against the PRODUCTION Supabase project.",
      "",
      `  target: ${targetSupabaseUrl}`,
      "",
      "checkout.spec.ts places a real order and decrements real inventory — against this",
      "project that means live trading data and a phantom order in a real buyer's history.",
      "",
      "Point .env.local at a seeded test project, or, if you really mean it:",
      "  E2E_ALLOW_PRODUCTION=1 npm run test:e2e",
      "",
    ].join("\n"),
  );
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
