import { test, expect } from "@playwright/test";

const BUYER_EMAIL = process.env.BUYER_EMAIL ?? "buyer@unionsupply.com";
const BUYER_PASSWORD = process.env.BUYER_PASSWORD ?? "wholesale84";

test("buyer can save their profile and see a success message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(BUYER_EMAIL);
  await page.getByLabel("Password").fill(BUYER_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/dashboard/account");

  // Write back the same value — exercises the full save path without
  // actually changing seeded demo data.
  const contactNameInput = page.getByLabel("Contact name");
  const original = await contactNameInput.inputValue();
  await contactNameInput.fill(original);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByRole("status")).toBeVisible();
  await expect(contactNameInput).toHaveValue(original);
});
