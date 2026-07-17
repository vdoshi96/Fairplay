import { expect, test, type Locator, type Page } from "@playwright/test";

import { expectNoWcagAccessibilityViolations } from "./helpers/accessibility";

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

async function waitForFiniteAnimations(locator: Locator) {
  await locator.evaluate(async (element) => {
    if (typeof element.getAnimations !== "function") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return;
    }

    const finiteAnimations = element.getAnimations().filter((animation) => {
      const iterations = animation.effect?.getTiming().iterations;
      return iterations !== Infinity;
    });

    await Promise.all(
      finiteAnimations.map((animation) =>
        animation.finished.catch(() => undefined)
      )
    );
  });
}

test("auth → persona → Deal → Board → Check-in has no WCAG A/AA accessibility violations", async ({
  page
}, testInfo) => {
  let assignedCardTitle = "";

  await test.step("auth", async () => {
    const authResponse = await page.goto("/create-household");
    expect(authResponse?.ok()).toBe(true);
    const contentSecurityPolicy =
      authResponse?.headers()["content-security-policy"] ?? "";
    const responseNonce = contentSecurityPolicy.match(
      /'nonce-([A-Za-z0-9_-]+)'/
    )?.[1];
    expect(responseNonce).toMatch(/^[A-Za-z0-9_-]{16,}$/);

    const scriptNonce = await page.evaluate(() => {
      const themeBootstrap = Array.from(document.scripts).find(
        (script) =>
          !script.src &&
          script.textContent?.includes("fairplay:theme-mode") &&
          script.textContent.trimStart().startsWith("(function()")
      );

      return themeBootstrap?.nonce ?? null;
    });
    expect(scriptNonce).not.toBeNull();
    expect(scriptNonce).toBe(responseNonce);

    await expect(
      page.getByRole("heading", { name: "Create a household" })
    ).toBeVisible();
    await expectNoWcagAccessibilityViolations(page, testInfo, "Auth");

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
    await expectNoWcagAccessibilityViolations(page, testInfo, "Persona");
    await expectApiPost(page, "/api/personas/select", () =>
      page.getByRole("button", { name: /choose Alex/i }).click()
    );
    await expect(page).toHaveURL(/\/app\/onboarding/, { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: "Set up your household rhythm" })
    ).toBeVisible();
  });

  await test.step("Deal", async () => {
    await page.goto("/app/distribute");
    await expect(
      page.getByRole("heading", { name: "Deal the next card" })
    ).toBeVisible();
    const dealCard = page
      .getByTestId("swipe-deck")
      .locator('article[role="button"]')
      .first();
    await expect(dealCard).toBeVisible();
    assignedCardTitle = (await dealCard.getAttribute("aria-label")) ?? "";
    expect(assignedCardTitle).not.toBe("");

    await page
      .locator('[aria-label="Deal buttons"]')
      .getByRole("button", { exact: true, name: "Alex" })
      .click();
    await expect(
      page.getByText(`${assignedCardTitle} -> Alex`, { exact: true })
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId("deal-outgoing-card")).toHaveCount(0);
    await expectNoWcagAccessibilityViolations(
      page,
      testInfo,
      "Deal after assignment"
    );
  });

  await test.step("Board", async () => {
    await page.goto("/app/board");
    await expect(
      page.getByRole("heading", { name: "Card board" })
    ).toBeVisible();
    const alexLane = page
      .getByTestId("primary-board-lanes")
      .locator("details")
      .filter({
        has: page.getByRole("heading", { exact: true, name: "Alex" })
      });
    await expect(
      alexLane.getByText(assignedCardTitle, { exact: true })
    ).toBeVisible();
    await expectNoWcagAccessibilityViolations(page, testInfo, "Board");
  });

  await test.step("Check-in", async () => {
    await page.goto("/app/check-ins");
    await expect(
      page.getByRole("heading", { name: "Schedule check-in" })
    ).toBeVisible();
    await page.getByLabel("Check-in date").fill("2026-08-20");
    await page.getByLabel("Check-in time").fill("18:30");
    await expectApiPost(page, "/api/check-ins", () =>
      page.getByRole("button", { exact: true, name: "Schedule" }).click()
    );
    await expect(
      page.getByRole("heading", { name: "Scheduled check-in" })
    ).toBeVisible();
    const checkInMotionPanel = page.locator(".fp-motion-panel-enter").first();
    await expect(checkInMotionPanel).toBeVisible();
    await waitForFiniteAnimations(checkInMotionPanel);
    await expectNoWcagAccessibilityViolations(
      page,
      testInfo,
      "Check-in after scheduling"
    );
  });
});
