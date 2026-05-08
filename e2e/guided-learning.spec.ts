import { expect, test, type Page } from "@playwright/test";

function uniqueHouseholdSlug() {
  return `guide-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

const retiredGuideLabel = ["App", "Guide", "101"].join(" ");

async function mockOnboardingPreviewRoute(page: Page) {
  await page.route("**/api/ai-card-drafts/onboarding-preview", async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { inputText?: string };

    await route.fulfill({
      contentType: "application/json",
      json: {
        title: "Lunch packing handoff",
        summary:
          body.inputText?.trim() ||
          "Make a lunch packing handoff card.",
        definition: "Pack lunches and return the kit to the same place.",
        conception: "Decide what counts as ready before the school morning.",
        planning: "Check supplies and assign the next visible step.",
        execution: "Pack, label, and reset the lunch kit.",
        minimumStandard: "Lunches are ready before departure."
      },
      status: 200
    });
  });
}

test("guided learning surfaces are persistent, skippable, and user-triggered", async ({
  context,
  page
}) => {
  await context.clearCookies();
  await mockOnboardingPreviewRoute(page);

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
    page.getByRole("heading", { name: "Your Cards" })
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

  const linkedGuide = page.getByRole("dialog", { name: "Library guide" });
  await expect(linkedGuide).toBeVisible();
  await expect(page.getByText("Step 1 of 4")).toBeVisible();
  await expect(
    linkedGuide.getByRole("heading", { name: "Practice first" })
  ).toBeVisible();
  await expect(page.getByTestId("guide-highlight")).toBeVisible();
  await expect(linkedGuide.getByRole("button", { name: "Next", exact: true }))
    .toBeDisabled();

  await linkedGuide.getByRole("button", { name: "Start practice" }).click();
  await page.getByLabel("Practice card request").fill("Make a lunch packing handoff card.");
  await page.getByRole("button", { name: "Create practice draft" }).click();
  await expect(page.getByText("Practice draft created.")).toBeVisible();
  await page.getByRole("button", { name: "Review draft" }).click();
  await page.getByLabel("Practice draft title").fill("Lunch kit reset");
  await page.getByRole("button", { name: "Save edits" }).click();
  await page.getByRole("button", { name: "Preview on Board" }).click();
  await expect(page.getByText("Practice complete.")).toBeVisible();
  await linkedGuide.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Search the source deck")).toBeVisible();
  await page.getByLabel("Guided tour backdrop").click();
  await expect(linkedGuide).toBeVisible();
  await linkedGuide.getByRole("button", { name: "Back", exact: true }).click();
  await expect(
    linkedGuide.getByRole("heading", { name: "Practice first" })
  ).toBeVisible();
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

  await page.goto("/app/crash-course");
  await expect(
    page.getByRole("img", { name: "Household load learning scene" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Next lesson" }).click();
  await expect(
    page.getByRole("img", { name: "Reminder and visible work storyboard scene" })
  ).toBeVisible();
});
