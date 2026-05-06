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
  return expectApiRequest(page, path, "POST", action);
}

async function expectApiPatch(
  page: Page,
  path: string,
  action: () => Promise<void>
) {
  return expectApiRequest(page, path, "PATCH", action);
}

async function expectApiRequest(
  page: Page,
  path: string,
  method: "PATCH" | "POST",
  action: () => Promise<void>
) {
  const apiResponse = page
    .waitForResponse((response) =>
      response.url().includes(path) && response.request().method() === method
    )
    .then((response) => ({ response }));
  const apiFailure = page
    .waitForEvent("requestfailed", {
      predicate: (request) =>
        request.url().includes(path) && request.method() === method,
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

async function expectLittleAlexInViewport(
  page: Page,
  options: { minLeft?: number } = {}
) {
  await expect(page.getByTestId("little-alex-body-part")).toHaveCount(6);

  await expect
    .poll(
      () =>
        page.evaluate(({ minLeft }) => {
          const tolerance = 1;
          const viewport = {
            height: window.innerHeight,
            width: window.innerWidth
          };

          return Array.from(
            document.querySelectorAll<HTMLElement>(
              '[data-testid="little-alex-body-part"]'
            )
          )
            .filter((part) => {
              const style = window.getComputedStyle(part);
              const rect = part.getBoundingClientRect();

              return (
                style.display !== "none" &&
                style.visibility !== "hidden" &&
                rect.height > 0 &&
                rect.width > 0
              );
            })
            .flatMap((part) => {
              const rect = part.getBoundingClientRect();
              const name = part.dataset.part ?? "unknown";
              const failures: string[] = [];

              const minimumLeft = minLeft ?? 0;

              if (rect.left < minimumLeft - tolerance) {
                failures.push(`${name} left ${rect.left} < ${minimumLeft}`);
              }

              if (rect.top < -tolerance) {
                failures.push(`${name} top ${rect.top}`);
              }

              if (rect.right > viewport.width + tolerance) {
                failures.push(`${name} right ${rect.right} > ${viewport.width}`);
              }

              if (rect.bottom > viewport.height + tolerance) {
                failures.push(`${name} bottom ${rect.bottom} > ${viewport.height}`);
              }

              return failures;
            });
        }, options),
      { timeout: 3_000 }
    )
    .toEqual([]);
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

async function dragLittleAlexTo(page: Page, targetX: number, targetY: number) {
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
  await page.mouse.move((startX + targetX) / 2, (startY + targetY) / 2, {
    steps: 4
  });
  await page.mouse.move(targetX, targetY, { steps: 4 });
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
    await expect(page.getByTestId("little-alex-chat-bubble")).toHaveText(
      "i'm little alex horne"
    );
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

  test("stays to the right of the desktop sidebar after a leftward fling", async ({
    page
  }) => {
    await page.setViewportSize({ height: 720, width: 1280 });
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    await dragLittleAlex(page, -1_200, 120);
    await page.waitForTimeout(500);

    await expectLittleAlexInViewport(page, { minLeft: 256 });
  });

  test("uses saved Little Alex preferences for appearance and fling bubble", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/settings");

    await page.getByRole("button", { name: "Feminine" }).click();
    await page
      .getByLabel("Little Alex chat bubble phrase")
      .fill("well done everyone");
    await page.getByRole("button", { name: "Tone 4" }).click();
    await expectApiPatch(page, "/api/preferences/little-alex", () =>
      page.getByRole("button", { name: "Save Little Alex" }).click()
    );
    await expect(page.getByRole("status")).toContainText(
      "Little Alex updated for Alex."
    );

    await page.goto("/app/home");
    const littleAlex = page.getByTestId("little-alex-horne");

    await expect(littleAlex).toHaveAttribute(
      "data-gender-presentation",
      "feminine"
    );
    await expect(littleAlex).toHaveAttribute(
      "data-chat-phrase",
      "well done everyone"
    );
    await dragLittleAlex(page, -180, 120);
    await expect(page.getByTestId("little-alex-chat-bubble")).toHaveText(
      "well done everyone"
    );
  });

  test("stands still after five seconds untouched before slow idle walking", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    const littleAlex = page.getByTestId("little-alex-horne");

    await expect(littleAlex).toHaveAttribute("data-idle-state", "active");
    await expect(littleAlex).toHaveAttribute("data-idle-state", "standing", {
      timeout: 6_500
    });
    await expect(littleAlex).toHaveAttribute("data-idle-state", "walking", {
      timeout: 5_000
    });
    await expectLittleAlexInViewport(page);
  });

  test("keeps every body part inside a constrained mobile landscape viewport", async ({
    page
  }) => {
    await createHouseholdAndChooseAlex(page);
    await page.setViewportSize({ height: 260, width: 300 });
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toBeVisible();
    await expectLittleAlexInViewport(page);

    await dragLittleAlex(page, 220, 160);
    await page.waitForTimeout(500);

    await expectLittleAlexInViewport(page);
  });

  test("does not cover mobile navigation taps when resting near the bottom nav", async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ height: 720, width: 390 });
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    await expect(page.getByTestId("little-alex-horne")).toHaveCSS("z-index", "9");

    const mobileNav = page.getByRole("navigation", { name: "Primary" });
    const libraryLink = mobileNav.getByRole("link", { name: "Library" });
    const libraryBox = await libraryLink.boundingBox();

    expect(libraryBox).not.toBeNull();

    if (!libraryBox) {
      return;
    }

    await dragLittleAlexTo(
      page,
      libraryBox.x + libraryBox.width / 2,
      libraryBox.y + libraryBox.height / 2
    );

    await libraryLink.click();
    await expect(page).toHaveURL(/\/app\/library/);
  });

  test("uses a static draggable-safe mode with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await createHouseholdAndChooseAlex(page);
    await page.goto("/app/home");

    const littleAlex = page.getByTestId("little-alex-horne");
    await expect(littleAlex).toHaveAttribute("data-motion-mode", "reduced");
    await expect(littleAlex).toHaveAttribute("data-idle-state", "static");

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
