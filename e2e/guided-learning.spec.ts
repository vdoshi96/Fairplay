import { expect, test } from "@playwright/test";

function uniqueHouseholdSlug() {
  return `guide-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

test("guided learning surfaces are persistent, skippable, and user-triggered", async ({
  context,
  page
}) => {
  await context.clearCookies();

  await page.goto("/login");
  await expect(
    page.getByRole("img", { name: "Animated Fairplay household garden scene" })
  ).toBeVisible();

  const householdSlug = uniqueHouseholdSlug();
  await page.goto("/create-household");
  await page.getByLabel("Household display name").fill("Guide River Home");
  await page.getByLabel("Household username").fill(householdSlug);
  await page.getByLabel("Household password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Create household" }).click();

  await expect(page).toHaveURL(/\/choose-persona/);
  const personaSelection = page.waitForResponse((response) =>
    response.url().includes("/api/personas/select") &&
    response.request().method() === "POST"
  );
  await page.getByRole("button", { name: /choose Alex/i }).click();
  expect((await personaSelection).ok()).toBe(true);
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const body = (await response.json()) as { selectedPersonaId?: string | null };

        return body.selectedPersonaId ?? null;
      })
    )
    .not.toBeNull();
  await expect(page).toHaveURL(/\/app\/onboarding/);

  await page.goto("/app/home");
  await expect(
    page.getByRole("heading", { name: "Learn Fairplay in layers" })
  ).toBeVisible();

  const welcome = page.getByRole("dialog", { name: "Welcome to Fairplay" });
  await expect(welcome).toBeVisible();
  await expect(
    welcome.getByRole("link", { name: "Open App Guide 101" })
  ).toHaveAttribute("href", "/app/home#app-guide-101");

  await page.getByRole("link", { name: "Learn this feature: Library" }).click();
  await expect(page).toHaveURL(/\/app\/library\?guide=library/);
  await expect(welcome).toBeVisible();

  const linkedGuide = page.getByRole("dialog", { name: "Library guide" });
  await expect(linkedGuide).toBeVisible();
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
  await expect(page.getByTestId("guide-highlight")).toBeVisible();

  await page.getByLabel("Guided tour backdrop").click();
  await expect(linkedGuide).toBeVisible();

  await linkedGuide.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Labels group related work")).toBeVisible();
  await linkedGuide.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByText("Search the source deck")).toBeVisible();
  await linkedGuide.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(linkedGuide).not.toBeVisible();

  await page.goto("/app/library");
  await expect(
    page.getByRole("dialog", { name: "Library guide" })
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Learn this feature" }).click();
  const manualGuide = page.getByRole("dialog", { name: "Library guide" });
  await expect(manualGuide).toBeVisible();
  await manualGuide.getByRole("button", { name: "Skip", exact: true }).click();

  await page.getByRole("button", { name: "Close welcome" }).click();
  await expect(welcome).not.toBeVisible();
  await page.goto("/app/home");
  await expect(
    page.getByRole("dialog", { name: "Welcome to Fairplay" })
  ).not.toBeVisible();

  await page.goto("/app/crash-course");
  await expect(
    page.getByRole("img", { name: "Household load learning scene" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Next lesson" }).click();
  await expect(
    page.getByRole("img", { name: "Owner and helper learning scene" })
  ).toBeVisible();
});
