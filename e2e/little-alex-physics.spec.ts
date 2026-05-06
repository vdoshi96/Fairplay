import { mkdir, rm } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const littleAlexSpriteScreenshotDir = "test-results/little-alex-qwen-sprites";
const littleAlexSpriteBasePath = "/assets/fairplay/little-alex-sprites";
const littleAlexSpriteParts = [
  "head",
  "torso",
  "leftArm",
  "rightArm",
  "leftLeg",
  "rightLeg"
] as const;
const littleAlexSpritePresentations = [
  "neutral",
  "masculine",
  "feminine"
] as const;

type LittleAlexSpritePart = (typeof littleAlexSpriteParts)[number];
type LittleAlexSpritePresentation = (typeof littleAlexSpritePresentations)[number];

function expectedLittleAlexSpritePath(
  presentation: LittleAlexSpritePresentation,
  part: LittleAlexSpritePart
) {
  return `${littleAlexSpriteBasePath}/${presentation}-${part}.png`;
}

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

async function saveLittleAlexPresentation(
  page: Page,
  presentation: LittleAlexSpritePresentation
) {
  const label = presentation.slice(0, 1).toUpperCase() + presentation.slice(1);

  await page.goto("/app/settings");
  await page.getByRole("button", { name: label }).click();
  await expectApiPatch(page, "/api/preferences/little-alex", () =>
    page.getByRole("button", { name: "Save Little Alex" }).click()
  );
  await expect(page.getByRole("status")).toContainText(
    "Little Alex updated for Alex."
  );
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

async function expectLittleAlexSpritesLoaded(
  page: Page,
  presentation: LittleAlexSpritePresentation
) {
  const expectedSpritePaths = Object.fromEntries(
    littleAlexSpriteParts.map((part) => [
      part,
      expectedLittleAlexSpritePath(presentation, part)
    ])
  ) as Record<LittleAlexSpritePart, string>;

  await expect(page.getByTestId("little-alex-body-part")).toHaveCount(
    littleAlexSpriteParts.length
  );

  await expect
    .poll(
      () =>
        page.evaluate(
          ({ expectedSpritePaths, parts }) => {
            const failures: string[] = [];
            const viewport = {
              height: window.innerHeight,
              width: window.innerWidth
            };

            for (const part of parts) {
              const expectedPath = expectedSpritePaths[part];
              const expectedUrl = new URL(expectedPath, window.location.origin).href;
              const bodyPart = document.querySelector<HTMLElement>(
                `[data-testid="little-alex-body-part"][data-part="${part}"]`
              );

              if (!bodyPart) {
                failures.push(`${part} body part is missing`);
                continue;
              }

              const sprite = Array.from(bodyPart.querySelectorAll("img")).find(
                (image) =>
                  image.currentSrc === expectedUrl ||
                  image.src === expectedUrl ||
                  image.getAttribute("src") === expectedPath ||
                  image.dataset.spriteSrc === expectedPath
              );

              if (!sprite) {
                failures.push(`${part} sprite image missing ${expectedPath}`);
                continue;
              }

              if (
                !sprite.complete ||
                sprite.naturalHeight <= 0 ||
                sprite.naturalWidth <= 0
              ) {
                failures.push(`${part} sprite image did not load`);
              }

              const rect = sprite.getBoundingClientRect();
              if (
                rect.width <= 0 ||
                rect.height <= 0 ||
                rect.left < -1 ||
                rect.top < -1 ||
                rect.right > viewport.width + 1 ||
                rect.bottom > viewport.height + 1
              ) {
                failures.push(`${part} sprite is outside safe viewport bounds`);
              }
            }

            return failures;
          },
          {
            expectedSpritePaths,
            parts: littleAlexSpriteParts
          }
        ),
      { timeout: 5_000 }
    )
    .toEqual([]);
}

async function littleAlexRigProportionFailures(page: Page) {
  await expect(page.getByTestId("little-alex-body-part")).toHaveCount(
    littleAlexSpriteParts.length
  );

  return page.evaluate((parts) => {
    type RectSnapshot = {
      bottom: number;
      height: number;
      left: number;
      right: number;
      top: number;
      width: number;
    };

    type PartSnapshot = {
      part: string;
      rect: RectSnapshot;
    };

    const horizontalOverlap = (a: RectSnapshot, b: RectSnapshot) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const verticalOverlap = (a: RectSnapshot, b: RectSnapshot) =>
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    const verticalGap = (upper: RectSnapshot, lower: RectSnapshot) =>
      lower.top - upper.bottom;

    const snapshots = Object.fromEntries(
      parts.map((part) => {
        const bodyPart = document.querySelector<HTMLElement>(
          `[data-testid="little-alex-body-part"][data-part="${part}"]`
        );
        const rect = bodyPart?.getBoundingClientRect();

        if (!bodyPart || !rect) {
          return [part, null];
        }

        return [
          part,
          {
            part,
            rect: {
              bottom: rect.bottom,
              height: rect.height,
              left: rect.left,
              right: rect.right,
              top: rect.top,
              width: rect.width
            }
          } satisfies PartSnapshot
        ];
      })
    ) as Record<string, PartSnapshot | null>;

    const failures: string[] = [];

    for (const part of parts) {
      if (!snapshots[part]) {
        failures.push(`${part} body part is missing`);
      }
    }

    const head = snapshots.head?.rect;
    const torso = snapshots.torso?.rect;
    const leftArm = snapshots.leftArm?.rect;
    const rightArm = snapshots.rightArm?.rect;
    const leftLeg = snapshots.leftLeg?.rect;
    const rightLeg = snapshots.rightLeg?.rect;

    if (head && torso) {
      const neckGap = verticalGap(head, torso);
      const neckOverlap = horizontalOverlap(head, torso);

      if (neckGap < -2 || neckGap > 4) {
        failures.push(
          `head/torso vertical gap ${neckGap.toFixed(1)} is outside -2..4`
        );
      }

      if (neckOverlap < Math.min(head.width, torso.width) * 0.42) {
        failures.push(
          `head/torso horizontal overlap ${neckOverlap.toFixed(1)} is too small`
        );
      }
    }

    for (const [name, leg] of [
      ["leftLeg", leftLeg],
      ["rightLeg", rightLeg]
    ] as const) {
      if (!torso || !leg) {
        continue;
      }

      const hipGap = verticalGap(torso, leg);
      const hipOverlap = horizontalOverlap(torso, leg);

      if (hipGap > 2) {
        failures.push(`torso/${name} vertical gap ${hipGap.toFixed(1)} > 2`);
      }

      if (hipOverlap < leg.width * 0.55) {
        failures.push(
          `torso/${name} horizontal overlap ${hipOverlap.toFixed(1)} is too small`
        );
      }
    }

    for (const [name, arm] of [
      ["leftArm", leftArm],
      ["rightArm", rightArm]
    ] as const) {
      if (!torso || !arm) {
        continue;
      }

      const shoulderOverlap = horizontalOverlap(torso, arm);
      const shoulderBand = {
        ...torso,
        bottom: torso.top + torso.height * 0.42
      };
      const shoulderVerticalOverlap = verticalOverlap(shoulderBand, arm);

      if (shoulderOverlap < arm.width * 0.35) {
        failures.push(
          `torso/${name} shoulder overlap ${shoulderOverlap.toFixed(1)} is too small`
        );
      }

      if (shoulderVerticalOverlap < arm.height * 0.2) {
        failures.push(
          `torso/${name} shoulder vertical overlap ${shoulderVerticalOverlap.toFixed(
            1
          )} is too small`
        );
      }
    }

    return failures;
  }, littleAlexSpriteParts);
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

  test.beforeAll(async () => {
    await rm(littleAlexSpriteScreenshotDir, { force: true, recursive: true });
    await mkdir(littleAlexSpriteScreenshotDir, { recursive: true });
  });

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
    const littleAlex = page.getByTestId("little-alex-horne");
    const viewport = page.viewportSize();

    await expect
      .poll(async () => {
        await page.mouse.move(32, 180);

        return littleAlex.getAttribute("data-gaze-direction");
      })
      .toBe("left");
    await expect
      .poll(async () => {
        await page.mouse.move((viewport?.width ?? 1280) - 24, 180);

        return littleAlex.getAttribute("data-gaze-direction");
      })
      .toBe("right");

    const grabTarget = page.getByTestId("little-alex-grab-target");
    const grabBox = await grabTarget.boundingBox();

    expect(grabBox).not.toBeNull();

    if (!grabBox) {
      return;
    }

    await page.mouse.click(
      grabBox.x + grabBox.width / 2,
      grabBox.y + grabBox.height / 2
    );
    await expect(page.getByTestId("little-alex-chat-bubble")).toHaveCount(0);

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
    await expect
      .poll(
        () =>
          littleAlex.evaluate((element) => {
            const idleState = element.getAttribute("data-idle-state");
            const turns = Number(element.getAttribute("data-idle-walk-turns") ?? 0);

            return idleState === "walking" || turns > 0;
          }),
        { timeout: 6_000 }
      )
      .toBe(true);
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

  test("captures visual QA screenshots for all sprite presentations", async ({
    page
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ height: 720, width: 1280 });
    await createHouseholdAndChooseAlex(page);
    const rigProportionFailures: string[] = [];

    for (const presentation of littleAlexSpritePresentations) {
      await saveLittleAlexPresentation(page, presentation);
      await page.goto("/app/home");

      const littleAlex = page.getByTestId("little-alex-horne");
      await expect(littleAlex).toHaveAttribute(
        "data-gender-presentation",
        presentation
      );
      await expectLittleAlexSpritesLoaded(page, presentation);
      await expectLittleAlexInViewport(page, { minLeft: 256 });

      await page.screenshot({
        fullPage: false,
        path: `${littleAlexSpriteScreenshotDir}/${presentation}.png`
      });
      rigProportionFailures.push(
        ...(await littleAlexRigProportionFailures(page)).map(
          (failure) => `${presentation}: ${failure}`
        )
      );

      await dragLittleAlex(page, -220, 120);
      await expect(page.getByTestId("little-alex-chat-bubble")).toHaveText(
        "i'm little alex horne"
      );
      await expectLittleAlexInViewport(page, { minLeft: 256 });
    }

    expect(rigProportionFailures).toEqual([]);
  });
});
