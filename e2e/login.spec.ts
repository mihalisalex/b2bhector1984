import { test, expect } from "@playwright/test";

const BUYER_EMAIL = process.env.BUYER_EMAIL ?? "buyer@unionsupply.com";
const BUYER_PASSWORD = process.env.BUYER_PASSWORD ?? "wholesale84";

test("buyer can log in and reach the dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(BUYER_EMAIL);
  await page.getByLabel("Password").fill(BUYER_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("admin can log in and reach the admin orders page", async ({ page }) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  test.skip(!adminEmail || !adminPassword, "ADMIN_EMAIL/ADMIN_PASSWORD not set in .env.local");

  await page.goto("/login");
  await page.getByLabel("Email").fill(adminEmail!);
  await page.getByLabel("Password").fill(adminPassword!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/admin/);
});
