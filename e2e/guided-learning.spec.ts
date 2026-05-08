import { expect, test } from "@playwright/test";

function uniqueHouseholdSlug() {
  return `guide-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

const retiredGuideLabel = ["App", "Guide", "101"].join(" ");

test("learning surfaces do not expose retired feature guides", async ({
  context,
  page
}) => {
  await context.clearCookies();
  const previewRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/ai-card-drafts/onboarding-preview")) {
      previewRequests.push(request.url());
    }
  });

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

  await page.goto("/app/your-cards");
  await expect(
    page.getByRole("heading", { name: "Your Deck" })
  ).toBeVisible();

  await expect(
    page.getByRole("dialog", { name: "Welcome to Fairplay" })
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Learn a feature" })
  ).toHaveCount(0);
  await expect(page.getByText(retiredGuideLabel)).toHaveCount(0);

  await page.goto("/app/library?guide=library");
  await expect(page).toHaveURL(/\/app\/library\?guide=library/);
  await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Library guide" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Learn this feature" }))
    .toHaveCount(0);
  await expect(page.getByRole("button", { name: "Ask Greg" })).toBeVisible();
  await expect(page.getByText("Practice a card")).toHaveCount(0);

  await page.goto("/app/library");
  await expect(page.getByRole("dialog", { name: "Library guide" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Learn this feature" }))
    .toHaveCount(0);

  await page.goto("/app/settings?guide=settings");
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Settings guide" }))
    .toHaveCount(0);
  await expect(page.getByRole("button", { name: "Learn this feature" }))
    .toHaveCount(0);

  await page.goto("/app/check-ins");
  await expect(page.getByRole("heading", { name: "Schedule check-in" }))
    .toBeVisible();
  await expect(page.getByRole("button", { name: "Learn this feature" }))
    .toHaveCount(0);
  expect(previewRequests).toEqual([]);

  await page.goto("/app/crash-course");
  await expect(
    page.getByRole("img", { name: "Household load learning scene" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Next lesson" }).click();
  await expect(
    page.getByRole("img", { name: "Reminder and visible work storyboard scene" })
  ).toBeVisible();
});
