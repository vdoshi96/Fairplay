import { expect, test, type Page } from "@playwright/test";

function uniqueHouseholdSlug() {
  return `alex-physics-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

async function expectApiPost(
  page: Page,
  path: string,
  action: () => Promise<void>
) {
  const apiResponse = page
    .waitForResponse((response) =>
      response.url().includes(path) && response.request().method() === "POST"
    )
    .then((response) => ({ response }));
  const apiFailure = page
    .waitForEvent("requestfailed", {
      predicate: (request) =>
        request.url().includes(path) && request.method() === "POST",
      timeout: 20_000
    })
    .then((request) => ({ request }));

  await action();
  const result = await Promise.race([apiResponse, apiFailure]);

  if ("request" in result) {
    const failure = result.request.failure();

    throw new Error(`${path} request failed: ${failure?.errorText ?? "unknown error"}`);
  }

  const responseText = await result.response.text();
  expect(
    result.response.ok(),
    `${path} failed: ${result.response.status()} ${responseText}`
  ).toBe(true);
}

async function createHouseholdAndChooseAlex(page: Page) {
  await page.goto("/create-household");
  await page.getByLabel("Household display name").fill("Alex Physics Home");
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
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const body = (await response.json()) as {
          selectedPersonaId?: string | null;
        };

        return body.selectedPersonaId ?? null;
      })
    )
    .not.toBeNull();
}

async function expectLittleAlexInViewport(page: Page) {
  const torso = page.locator('[data-part="torso"]');
  const box = await torso.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();

  if (!box || !viewport) {
    return;
  }

  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
}

async function dragLittleAlex(page: Page, deltaX: number, deltaY: number) {
  const grabTarget = page.getByTestId("little-alex-grab-target");
  const box = await grabTarget.boundingBox();

  expect(box).not.toBeNull();

  if (!box) {
    return;
  }

  const startX = box.x + box.width / 2;
  const startY = box.y + box.height / 2;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + deltaX * 0.45, startY + deltaY * 0.45, {
    steps: 4
  });
  await page.mouse.move(startX + deltaX, startY + deltaY, { steps: 4 });
  await page.mouse.up();
}

test.describe("Little Alex physics", () => {
  test.describe.configure({ mode: "serial" });

  test("appears globally on standard and immersive protected app routes", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);

    await page.goto("/app/home");
    await expect(page.getByTestId("little-alex-horne")).toHaveAttribute(
      "data-motion-mode",
      "physics"
    );
    await expect(page.getByTestId("little-alex-body-part")).toHaveCount(6);
    await expect(page.getByRole("button", { name: /little alex/i })).toHaveCount(0);
    await expect(page.getByTestId("little-alex-horne")).toHaveCSS(
      "pointer-events",
      "none"
    );
    await expect(page.getByTestId("little-alex-grab-target")).toHaveCSS(
      "pointer-events",
      "auto"
    );

    await page.goto("/app/crash-course");
    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    await expect(page.getByTestId("app-main")).toHaveAttribute(
      "data-layout",
      "immersive"
    );
  });

  test("can be dragged and flung while staying inside the viewport", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    const torso = page.locator('[data-part="torso"]');
    const before = await torso.boundingBox();

    await dragLittleAlex(page, -240, 180);
    await page.waitForTimeout(500);

    const after = await torso.boundingBox();
    expect(after).not.toBeNull();
    expect(before).not.toBeNull();

    if (before && after) {
      expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(
        20
      );
    }

    await expectLittleAlexInViewport(page);
  });

  test("uses a static draggable-safe mode with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    const littleAlex = page.getByTestId("little-alex-horne");
    await expect(littleAlex).toHaveAttribute("data-motion-mode", "reduced");

    const torso = page.locator('[data-part="torso"]');
    const before = await torso.boundingBox();
    await dragLittleAlex(page, -180, 80);
    const after = await torso.boundingBox();

    expect(before).not.toBeNull();
    expect(after).not.toBeNull();

    if (before && after) {
      expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(
        20
      );
    }

    await expectLittleAlexInViewport(page);
  });
});
