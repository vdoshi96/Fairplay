import { expect, test } from "@playwright/test";

test("root redirects signed-out users to login", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Log in to Fairplay" })).toBeVisible();
});
