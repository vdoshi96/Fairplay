import { expect, test, type Page } from "@playwright/test";

import { expectNoSeriousAccessibilityViolations } from "./helpers/accessibility";

function uniqueHouseholdSlug(projectName: string) {
  const normalizedProject = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `a11y-${normalizedProject}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 6)}`.slice(0, 40);
}

async function expectApiPost(
  page: Page,
  routePath: string,
  action: () => Promise<void>
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(routePath) &&
      response.request().method() === "POST"
  );

  await action();
  const response = await responsePromise;
  const responseText = await response.text();

  expect(
    response.ok(),
    `${routePath} failed: ${response.status()} ${responseText}`
  ).toBe(true);
}

test("auth → persona → Deal → Board → Check-in has no serious accessibility violations", async ({
  page
}, testInfo) => {
  await test.step("auth", async () => {
    await page.goto("/create-household");
    await expect(
      page.getByRole("heading", { name: "Create your household" })
    ).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page, testInfo, "Auth");

    await page.getByLabel("Household display name").fill("Accessibility QA Home");
    await page
      .getByLabel("Household username")
      .fill(uniqueHouseholdSlug(testInfo.project.name));
    await page
      .getByLabel("Household password")
      .fill("correct horse battery staple");
    await expectApiPost(page, "/api/auth/create-household", () =>
      page.getByRole("button", { name: "Create household" }).click()
    );
  });

  await test.step("persona", async () => {
    await expect(page).toHaveURL(/\/choose-persona/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Choose Alex or Max" })
    ).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page, testInfo, "Persona");
    await expectApiPost(page, "/api/personas/select", () =>
      page.getByRole("button", { name: /choose Alex/i }).click()
    );
    await expect(page).toHaveURL(/\/app\/onboarding/, { timeout: 10_000 });
  });

  await test.step("Deal", async () => {
    await page.goto("/app/distribute");
    await expect(
      page.getByRole("heading", { name: "Deal the next card" })
    ).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page, testInfo, "Deal");
  });

  await test.step("Board", async () => {
    await page.goto("/app/board");
    await expect(
      page.getByRole("heading", { name: "Card board" })
    ).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page, testInfo, "Board");
  });

  await test.step("Check-in", async () => {
    await page.goto("/app/check-ins");
    await expect(
      page.getByRole("heading", { name: "Schedule check-in" })
    ).toBeVisible();
    await expectNoSeriousAccessibilityViolations(page, testInfo, "Check-in");
  });
});
