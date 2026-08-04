import { test, expect } from "@playwright/test";

const BUYER_EMAIL = process.env.BUYER_EMAIL ?? "buyer@unionsupply.com";
const BUYER_PASSWORD = process.env.BUYER_PASSWORD ?? "wholesale84";

/**
 * Places a real order against whatever Supabase project .env.local points
 * to, decrementing real inventory — see playwright.config.ts's top comment.
 */
test("buyer can add styles to cart and place an order", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(BUYER_EMAIL);
  await page.getByLabel("Password").fill(BUYER_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/quick-order");

  // Fill enough box steppers to clear the 40-pair order minimum. Assumes the
  // smallest box (8 pairs) as a conservative lower bound — real box sizes are
  // 8/10/12, so this comfortably clears the minimum.
  //
  // Each stepper writes straight to the cart (see OrderableLinesheet: no local
  // staging state, and no "Add all to cart" button to commit it — this spec used
  // to click one that no longer exists).
  const spinbuttons = page.getByRole("spinbutton");
  const count = await spinbuttons.count();
  let boxesFilled = 0;
  for (let i = 0; i < count && boxesFilled < 6; i++) {
    const input = spinbuttons.nth(i);
    if (await input.isDisabled()) continue;
    await input.fill("3");
    boxesFilled++;
  }
  expect(boxesFilled).toBeGreaterThan(0);

  await page.goto("/checkout");
  // No PO number field any more — removed in b73ccc7, along with the
  // "e.g. US-0530" placeholder this spec used to fill.
  await page.getByRole("button", { name: "Request Proforma Invoice" }).click();

  await expect(page).toHaveURL(/\/dashboard\/orders\//, { timeout: 15_000 });
});
