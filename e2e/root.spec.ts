import { expect, test } from "@playwright/test";

test("root renders the Fairplay scaffold without an app error", async ({ page }) => {
  const response = await page.goto("/");

  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Fairplay" })).toBeVisible();
  const accountNav = page.getByRole("navigation", { name: "Account" });

  await expect(accountNav.getByRole("link", { name: "Log in" })).toHaveAttribute(
    "href",
    "/login"
  );
  await expect(
    accountNav.getByRole("link", { name: "Create household" })
  ).toHaveAttribute("href", "/create-household");
});
