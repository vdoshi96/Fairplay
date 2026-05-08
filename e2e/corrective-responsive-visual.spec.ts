import { mkdir, rm } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const screenshotDir = "test-results/corrective-responsive-visual";

const appPages = [
  { name: "your-cards", path: "/app/your-cards", heading: "Your Deck" },
  { name: "distribute", path: "/app/distribute", heading: "Deal the next card" },
  { name: "board", path: "/app/board", heading: "Card board" },
  { name: "ask-greg", path: "/app/ask-greg", heading: "Make more cards" },
  { name: "check-ins", path: "/app/check-ins", heading: "Schedule check-in" },
  { name: "settings", path: "/app/settings", heading: "Settings" },
  { name: "crash-course", path: "/app/crash-course", heading: "Concepts first. Tools after." }
] as const;

const viewports = [
  { height: 740, name: "narrow-mobile", width: 320 },
  { height: 844, name: "mobile", width: 390 },
  { height: 760, name: "small-tablet", width: 768 },
  { height: 900, name: "desktop", width: 1280 },
  { height: 768, name: "laptop", width: 1366 },
  { height: 620, name: "short-desktop", width: 1024 }
] as const;

function uniqueHouseholdSlug() {
  return `responsive-qa-${Date.now().toString(36)}-${Math.random()
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
  await page.getByLabel("Household display name").fill("Responsive QA Home");
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

async function closeWelcomeIfPresent(page: Page) {
  const closeWelcome = page.getByRole("button", { name: "Close welcome" });

  if ((await closeWelcome.count()) > 0) {
    await closeWelcome.click();
    await expect(page.getByRole("dialog", { name: "Welcome to Fairplay" }))
      .not.toBeVisible();
  }
}

async function createLoadMapResponsibility(page: Page) {
  await page.goto("/app/responsibilities/new");
  await page.getByLabel("Title").fill("Adult Friendships");
  await page
    .getByLabel("Summary")
    .fill("Keep friendship plans visible and kind.");
  await page.getByLabel("Area keys").fill("happiness_trio, magic");
  await page.getByLabel("Relevant days").fill("friday");
  await page.getByRole("combobox", { name: "Status" }).selectOption({
    label: "Active"
  });
  await page.getByRole("combobox", { name: "Alex role" }).selectOption({
    label: "Accountable Owner"
  });
  await page.getByRole("checkbox", { name: "Planning" }).check();
  await page.getByRole("button", { name: "Save" }).click();
  await expect(page.getByText("Saved.")).toBeVisible();
}

async function expectNoDocumentHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => {
    const width = window.innerWidth;

    return Math.max(
      document.documentElement.scrollWidth - width,
      document.body.scrollWidth - width
    );
  });

  expect(overflow, `${label} should not create document horizontal overflow`)
    .toBeLessThanOrEqual(1);
}

async function expectLittleAlexFullyVisible(page: Page, label: string) {
  const failures = await page.evaluate(() => {
    const desktopLittleAlex = window.matchMedia(
      "(min-width: 1024px) and (hover: hover) and (pointer: fine)"
    ).matches;
    const viewport = {
      height: window.innerHeight,
      width: window.innerWidth
    };
    const shell = document.querySelector<HTMLElement>('[data-testid="little-alex-horne"]');

    if (!desktopLittleAlex) {
      return shell
        ? ["Little Alex should not render on mobile or touch-first layouts"]
        : [];
    }

    if (!shell) {
      return ["Little Alex should render on desktop pointer layouts"];
    }

    const shellRect = shell?.getBoundingClientRect();
    const blockingRects = Array.from(
      document.querySelectorAll<HTMLElement>(
        'aside, nav[aria-label="Primary"]'
      )
    )
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          label: element.tagName.toLowerCase(),
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top
        };
      });
    const interactiveRects = Array.from(
      document.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [role="button"], [role="link"]'
      )
    )
      .filter((element) => {
        if (element.closest('[data-testid="little-alex-horne"]')) {
          return false;
        }

        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();

        return {
          label:
            element.getAttribute("aria-label") ??
            element.textContent?.trim().slice(0, 40) ??
            element.tagName.toLowerCase(),
          bottom: rect.bottom,
          left: rect.left,
          right: rect.right,
          top: rect.top
        };
      });
    const overlapArea = (
      a: { bottom: number; left: number; right: number; top: number },
      b: { bottom: number; left: number; right: number; top: number }
    ) => {
      const width = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);

      return width > 0 && height > 0 ? width * height : 0;
    };

    return Array.from(
      document.querySelectorAll<HTMLElement>(
        '[data-testid="little-alex-full-sprite"], [data-testid="little-alex-body-part"]'
      )
    )
      .filter((element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          style.opacity !== "0" &&
          rect.width > 0 &&
          rect.height > 0
        );
      })
      .flatMap((element) => {
        const tolerance = 2;
        const rect = element.getBoundingClientRect();
        const name = element.dataset.part ?? element.dataset.testid ?? "little-alex";
        const partFailures: string[] = [];

        if (rect.left < -tolerance) {
          partFailures.push(`${name} left ${rect.left}`);
        }

        if (rect.top < -tolerance) {
          partFailures.push(`${name} top ${rect.top}`);
        }

        if (rect.right > viewport.width + tolerance) {
          partFailures.push(`${name} right ${rect.right} > ${viewport.width}`);
        }

        if (rect.bottom > viewport.height + tolerance) {
          partFailures.push(`${name} bottom ${rect.bottom} > ${viewport.height}`);
        }

        if (shellRect && rect.bottom > shellRect.bottom + tolerance) {
          partFailures.push(
            `${name} bottom ${rect.bottom} > shell paint bottom ${shellRect.bottom}`
          );
        }

        blockingRects.forEach((blockingRect) => {
          if (overlapArea(rect, blockingRect) > 1) {
            partFailures.push(`${name} overlaps ${blockingRect.label} chrome`);
          }
        });

        interactiveRects.forEach((interactiveRect) => {
          const area = overlapArea(rect, interactiveRect);
          if (area > 8) {
            partFailures.push(
              `${name} overlaps interactive control ${interactiveRect.label} (${Math.round(
                area
              )}px2)`
            );
          }
        });

        return partFailures;
      });
  });

  expect(failures, `${label} should keep Little Alex inside the viewport`).toEqual([]);
}

async function expectFeatureGuideButtonInsideViewport(page: Page, label: string) {
  const learnButtons = page.getByRole("button", { name: "Learn this feature" });

  if ((await learnButtons.count()) === 0) {
    return;
  }

  const box = await learnButtons.first().boundingBox();
  expect(box, `${label} Learn this feature button should have layout`).not.toBeNull();

  if (!box) {
    return;
  }

  expect(box.x, `${label} Learn this feature x`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${label} Learn this feature right edge`)
    .toBeLessThanOrEqual(page.viewportSize()?.width ?? box.x + box.width);
  expect(box.y, `${label} Learn this feature y`).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height, `${label} Learn this feature bottom edge`)
    .toBeLessThanOrEqual(page.viewportSize()?.height ?? box.y + box.height);

  const failures = await learnButtons.first().evaluate((button) => {
    const rect = button.getBoundingClientRect();
    const center = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
    const hit = document.elementFromPoint(center.x, center.y);
    const visibleBottomNav = Array.from(
      document.querySelectorAll<HTMLElement>('nav[aria-label="Primary"]')
    ).find((nav) => {
      const style = getComputedStyle(nav);
      const navRect = nav.getBoundingClientRect();

      return (
        style.position === "fixed" &&
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        navRect.width > 0 &&
        navRect.height > 0 &&
        navRect.bottom >= window.innerHeight - 1
      );
    });
    const navRect = visibleBottomNav?.getBoundingClientRect();
    const issues: string[] = [];

    if (hit && hit !== button && !button.contains(hit)) {
      issues.push(`center hit ${hit.tagName.toLowerCase()} instead of button`);
    }

    if (navRect && rect.bottom > navRect.top - 6) {
      issues.push(`bottom ${rect.bottom} too close to bottom nav ${navRect.top}`);
    }

    return issues;
  });

  expect(failures, `${label} Learn this feature button should be reachable`).toEqual([]);
}

async function expectPageBackground(page: Page, pageName: string) {
  if (pageName === "crash-course") {
    await expect(page.getByTestId("crash-course-subtitle-panel")).toBeVisible();
    return;
  }

  const shellMetrics = await page.getByTestId("page-shell").evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      height: rect.height,
      minHeight: getComputedStyle(element).minHeight
    };
  });

  expect(shellMetrics.minHeight, `${pageName} shell min-height should resolve`)
    .not.toBe("0px");
  expect(shellMetrics.height, `${pageName} shell should fill the viewport floor`)
    .toBeGreaterThanOrEqual(windowlessViewportHeight(page) - 90);

  const background = page.locator("[data-testid^='page-shell-background-']").first();
  await expect(background).toHaveAttribute("aria-hidden", "true");
  const backgroundInfo = await background.evaluate(async (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const backgroundImage = style.backgroundImage;
    const match = /url\(["']?(.*?)["']?\)/.exec(backgroundImage);

    if (!match) {
      return {
        backgroundImage,
        height: rect.height,
        loaded: false,
        opaquePixel: false,
        width: rect.width
      };
    }

    const image = new Image();
    image.src = new URL(match[1], window.location.href).href;
    const loaded = await new Promise<boolean>((resolve) => {
      image.onload = () => resolve(true);
      image.onerror = () => resolve(false);
    });
    let opaquePixel = false;

    if (loaded) {
      const canvas = document.createElement("canvas");
      canvas.height = 8;
      canvas.width = 8;
      const context = canvas.getContext("2d");
      context?.drawImage(image, 0, 0, 8, 8);
      const data = context?.getImageData(0, 0, 8, 8).data;
      opaquePixel = data
        ? Array.from({ length: data.length / 4 }).some(
            (_, index) => data[index * 4 + 3] > 0
          )
        : false;
    }

    return {
      backgroundImage,
      height: rect.height,
      loaded,
      opaquePixel,
      width: rect.width
    };
  });

  expect(backgroundInfo.backgroundImage, `${pageName} page shell background`)
    .not.toBe("none");
  expect(backgroundInfo.width, `${pageName} background width`).toBeGreaterThan(100);
  expect(backgroundInfo.height, `${pageName} background height`).toBeGreaterThan(100);
  expect(backgroundInfo.loaded, `${pageName} background asset loaded`).toBe(true);
  expect(backgroundInfo.opaquePixel, `${pageName} background has painted pixels`)
    .toBe(true);
}

function windowlessViewportHeight(page: Page) {
  return page.viewportSize()?.height ?? 0;
}

test.describe("corrective responsive visual QA", () => {
  test.describe.configure({ mode: "serial" });
  test.setTimeout(90_000);

  test.beforeAll(async () => {
    await rm(screenshotDir, { force: true, recursive: true });
    await mkdir(screenshotDir, { recursive: true });
  });

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
    await mkdir(screenshotDir, { recursive: true });
  });

  test("captures real app pages across responsive viewport sizes", async ({ page }) => {
    const consoleIssues: string[] = [];
    await page.addInitScript(() => {
      const installSafeAreaOverride = () => {
        if (document.getElementById("corrective-safe-area-override")) {
          return;
        }

        const style = document.createElement("style");
        style.id = "corrective-safe-area-override";
        style.textContent = ":root { --fp-app-safe-area-bottom: 28px !important; }";
        document.head.append(style);
      };

      if (document.head) {
        installSafeAreaOverride();
      } else {
        document.addEventListener("DOMContentLoaded", installSafeAreaOverride, {
          once: true
        });
      }
    });

    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        /hydrated|hydration|uncaught|error/i.test(message.text())
      ) {
        consoleIssues.push(message.text());
      }
    });

    await createHouseholdAndChooseAlex(page);

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      for (const appPage of appPages) {
        await page.goto(appPage.path);
        await closeWelcomeIfPresent(page);
        await page.evaluate(() => window.scrollTo(0, 0));
        await expect
          .poll(() => page.evaluate(() => window.scrollY))
          .toBe(0);
        await expect(
          page.getByRole("heading", { name: appPage.heading })
        ).toBeVisible();
        await expectNoDocumentHorizontalOverflow(
          page,
          `${viewport.name} ${appPage.name}`
        );
        expect(
          await page.evaluate(() => document.body.innerText.includes("1 Issue")),
          `${viewport.name} ${appPage.name} should not show the dev issue overlay`
        ).toBe(false);
        await expectPageBackground(page, appPage.name);
        await expectFeatureGuideButtonInsideViewport(
          page,
          `${viewport.name} ${appPage.name}`
        );
        await expectLittleAlexFullyVisible(
          page,
          `${viewport.name} ${appPage.name}`
        );

        await page.screenshot({
          fullPage: true,
          path: `${screenshotDir}/${viewport.name}-${appPage.name}.png`
        });
      }
    }

    expect(consoleIssues).toEqual([]);
  });

  test("populated Board keeps card buckets usable without document overflow", async ({ page }) => {
    await createHouseholdAndChooseAlex(page);
    await closeWelcomeIfPresent(page);
    await createLoadMapResponsibility(page);

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto("/app/board");
      await closeWelcomeIfPresent(page);
      await expect(
        page.getByRole("heading", { name: "Card board" })
      ).toBeVisible();
      await expectNoDocumentHorizontalOverflow(
        page,
        `${viewport.name} populated board`
      );
      const board = page.getByTestId("card-board");
      await expect(board).toBeVisible();
      await expect(board.getByRole("heading", { name: "Alex" })).toBeVisible();
      await expect(board.getByRole("heading", { name: "Max" })).toBeVisible();
      await expect(board.getByRole("heading", { name: "Unassigned" }))
        .toHaveCount(0);
      await expect(board.getByText("Adult Friendships")).toBeVisible();

      await page.screenshot({
        fullPage: true,
        path: `${screenshotDir}/populated-${viewport.name}-board-initial.png`
      });

      await board.screenshot({
        path: `${screenshotDir}/populated-${viewport.name}-board.png`
      });
    }
  });

  test("Board remove returns a card to Deal while Library stays catalog-only", async ({ page }) => {
    await createHouseholdAndChooseAlex(page);
    await closeWelcomeIfPresent(page);
    await createLoadMapResponsibility(page);

    await page.goto("/app/board");
    await closeWelcomeIfPresent(page);
    await expect(page.getByRole("heading", { name: "Card board" })).toBeVisible();
    await page.getByRole("button", { name: "Remove from board" }).click();
    await page.waitForLoadState("networkidle");

    await page.goto("/app/distribute");
    await closeWelcomeIfPresent(page);
    await expect(page.getByRole("heading", { name: "Adult Friendships" }))
      .toBeVisible();

    await page.goto("/app/library");
    await closeWelcomeIfPresent(page);
    await expect(page.getByRole("region", { name: "Cards ready to deal" }))
      .toHaveCount(0);
    await expect(page.getByRole("article", { name: "Adult Friendships (Alex)" }))
      .toBeVisible();
  });
});
