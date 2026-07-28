import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

test("admin can change an order's status and it persists", async ({ page }) => {
  test.skip(!ADMIN_EMAIL || !ADMIN_PASSWORD, "ADMIN_EMAIL/ADMIN_PASSWORD not set in .env.local");

  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/admin/);

  const firstRow = page.locator("table tbody tr").first();
  test.skip((await firstRow.count()) === 0, "no orders in this environment to edit");

  await firstRow.getByRole("link").first().click();
  await expect(page).toHaveURL(/\/admin\/orders\//);

  const statusSelect = page.getByLabel("Order status");
  const originalStatus = await statusSelect.inputValue();
  // Only toggle between submitted/confirmed — avoids the shipped-requires-
  // tracking guard and any other status-specific side effects.
  test.skip(
    !["submitted", "confirmed"].includes(originalStatus),
    "order not in a safely-toggleable status for this smoke test",
  );
  const nextStatus = originalStatus === "submitted" ? "confirmed" : "submitted";

  await statusSelect.selectOption(nextStatus);
  await expect(statusSelect).toHaveValue(nextStatus);
  await page.reload();
  await expect(page.getByLabel("Order status")).toHaveValue(nextStatus);

  // Revert so this smoke test doesn't leave demo data mutated.
  await page.getByLabel("Order status").selectOption(originalStatus);
  await expect(page.getByLabel("Order status")).toHaveValue(originalStatus);
});
