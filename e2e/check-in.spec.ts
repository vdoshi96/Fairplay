import { expect, test, type Page } from "@playwright/test";

function uniqueHouseholdSlug() {
  return `check-in-qa-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

async function expectApiPost(
  page: Page,
  path: string,
  action: () => Promise<void>
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes(path) && response.request().method() === "POST"
  );

  await action();

  const response = await responsePromise;
  const responseText = await response.text();
  expect(
    response.ok(),
    `${path} failed: ${response.status()} ${responseText}`
  ).toBe(true);
}

async function createHouseholdAndChooseAlex(page: Page) {
  await page.goto("/create-household");
  await page.getByLabel("Household display name").fill("Check-in QA Home");
  await page.getByLabel("Household username").fill(uniqueHouseholdSlug());
  await page
    .getByLabel("Household password")
    .fill("correct horse battery staple");
  await expectApiPost(page, "/api/auth/create-household", () =>
    page.getByRole("button", { name: "Create household" }).click()
  );

  await expect(page).toHaveURL(/\/choose-persona/, { timeout: 10_000 });
  await expectApiPost(page, "/api/personas/select", () =>
    page.getByRole("button", { name: /choose Alex/i }).click()
  );
}

test("check-in flow schedules, confirms, updates notes, and persists history", async ({
  page
}) => {
  await createHouseholdAndChooseAlex(page);

  await page.goto("/app/check-ins");
  await expect(page.getByRole("heading", { name: "Schedule check-in" }))
    .toBeVisible();
  await expect(page.getByRole("button", { name: "Learn this feature" }))
    .toHaveCount(0);
  await page.getByLabel("Check-in date").fill("2026-05-20");
  await page.getByLabel("Check-in time").fill("18:30");
  await expectApiPost(page, "/api/check-ins", () =>
    page.getByRole("button", { name: "Schedule" }).click()
  );

  const confirmRegion = page.getByRole("region", { name: "Confirm check-in" });
  await expect(confirmRegion).toBeVisible();
  await confirmRegion.getByLabel("Minutes / notes").fill("Discussed summer routines.");
  await expectApiPost(page, "/api/check-ins/", () =>
    page.getByRole("button", { name: "Confirm it happened" }).click()
  );

  await expect(page.getByRole("heading", { name: "Check-in record" }))
    .toBeVisible();
  await expect(page.getByText("Check-in recorded.")).toBeVisible();
  const notesRegion = page.getByRole("region", { name: "Meeting notes" });
  await notesRegion.getByLabel("Minutes / notes").fill("Updated minutes.");
  await expectApiPost(page, "/api/check-ins/", () =>
    page.getByRole("button", { name: "Update notes" }).click()
  );
  await expect(page.getByText("Notes updated.")).toBeVisible();

  await page.goto("/app/check-ins");
  const history = page.getByRole("table", { name: "Check-in history" });

  await expect(history).toBeVisible();
  await expect(
    history.getByRole("columnheader", { name: "Previous check-in date" })
  ).toBeVisible();
  await expect(
    history.getByRole("columnheader", { name: "Previous check-in occurred" })
  ).toBeVisible();
  await expect(history.getByRole("columnheader", { name: "Minutes" }))
    .toBeVisible();
  await expect(history.getByText("Yes")).toBeVisible();
  await expect(history.getByText("Updated minutes.")).toBeVisible();
});
