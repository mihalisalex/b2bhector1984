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
