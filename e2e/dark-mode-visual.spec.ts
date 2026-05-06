import { mkdir, rm } from "node:fs/promises";

import { expect, test, type Locator, type Page } from "@playwright/test";

const screenshotDir = "test-results/dark-mode-polish";

const appPages = [
  { name: "home", path: "/app/home", heading: "Learn Fairplay in layers" },
  { name: "library", path: "/app/library", heading: "Source deck" },
  { name: "load-map", path: "/app/load-map", heading: "Responsibility overview" },
  { name: "radar", path: "/app/radar", heading: "Concern board" },
  { name: "check-ins", path: "/app/check-ins/new", heading: "New check-in" },
  { name: "crash-course", path: "/app/crash-course", heading: "Why this is not a chore app" },
  { name: "settings", path: "/app/settings", heading: "Household settings" }
] as const;

function uniqueHouseholdSlug() {
  return `dark-qa-${Date.now().toString(36)}-${Math.random()
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
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByLabel("Household display name").fill("Dark QA Home");
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

async function expectReadableText(page: Page) {
  const failures = await page.evaluate(() => {
    type Rgba = { a: number; b: number; g: number; r: number };

    function parseColor(value: string): Rgba | null {
      const match = value.match(
        /^rgba?\((\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?),\s*(\d+(?:\.\d+)?)(?:,\s*(\d+(?:\.\d+)?))?\)$/
      );

      if (!match) {
        return null;
      }

      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] === undefined ? 1 : Number(match[4])
      };
    }

    function blend(top: Rgba, bottom: Rgba): Rgba {
      const a = top.a + bottom.a * (1 - top.a);

      if (a === 0) {
        return { r: 0, g: 0, b: 0, a: 0 };
      }

      return {
        r: (top.r * top.a + bottom.r * bottom.a * (1 - top.a)) / a,
        g: (top.g * top.a + bottom.g * bottom.a * (1 - top.a)) / a,
        b: (top.b * top.a + bottom.b * bottom.a * (1 - top.a)) / a,
        a
      };
    }

    function backgroundFor(element: Element | null): Rgba {
      const fallback = { r: 22, g: 20, b: 17, a: 1 };

      if (!element || !(element instanceof HTMLElement)) {
        return fallback;
      }

      const parentBackground = backgroundFor(element.parentElement);
      const ownBackground = parseColor(getComputedStyle(element).backgroundColor);

      if (!ownBackground || ownBackground.a === 0) {
        return parentBackground;
      }

      return blend(ownBackground, parentBackground);
    }

    function luminance(color: Rgba) {
      const channels = [color.r, color.g, color.b].map((channel) => {
        const normalized = channel / 255;

        return normalized <= 0.03928
          ? normalized / 12.92
          : ((normalized + 0.055) / 1.055) ** 2.4;
      });

      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    }

    function contrastRatio(foreground: Rgba, background: Rgba) {
      const foregroundLuminance = luminance(foreground);
      const backgroundLuminance = luminance(background);
      const light = Math.max(foregroundLuminance, backgroundLuminance);
      const dark = Math.min(foregroundLuminance, backgroundLuminance);

      return (light + 0.05) / (dark + 0.05);
    }

    return Array.from(document.querySelectorAll<HTMLElement>("body *"))
      .filter((element) => {
        const directText = Array.from(element.childNodes).some(
          (node) =>
            node.nodeType === Node.TEXT_NODE &&
            (node.textContent ?? "").trim().length > 0
        );
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);

        return (
          directText &&
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          style.opacity !== "0" &&
          !element.matches("[disabled], [aria-hidden='true'] *")
        );
      })
      .flatMap((element) => {
        const foreground = parseColor(getComputedStyle(element).color);

        if (!foreground) {
          return [];
        }

        const background = backgroundFor(element);
        const ratio = contrastRatio(foreground, background);

        const fontSize = Number.parseFloat(getComputedStyle(element).fontSize);
        const fontWeight = Number.parseInt(getComputedStyle(element).fontWeight, 10);
        const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
        const threshold = isLargeText ? 3 : 4.5;

        return ratio < threshold
          ? [
              `${element.tagName.toLowerCase()} "${element.innerText
                .trim()
                .slice(0, 60)}" contrast ${ratio.toFixed(2)} < ${threshold}`
            ]
          : [];
      })
      .slice(0, 12);
  });

  expect(failures).toEqual([]);
}

async function expectUnobscured(locator: Locator, label: string) {
  await expect(locator).toBeVisible();

  const blocker = await locator.evaluate((element, elementLabel) => {
    const rect = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2
    );

    if (!topElement || topElement === element || element.contains(topElement)) {
      return null;
    }

    const blockerName = [
      topElement.tagName.toLowerCase(),
      topElement.id ? `#${topElement.id}` : "",
      topElement.className && typeof topElement.className === "string"
        ? `.${topElement.className.trim().split(/\s+/).join(".")}`
        : ""
    ].join("");

    return `${elementLabel} center blocked by ${blockerName}`;
  }, label);

  expect(blocker).toBeNull();

  const visualOverlap = await locator.evaluate((element, elementLabel) => {
    const rect = element.getBoundingClientRect();
    const overlays = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".fp-little-alex-full-sprite, .fp-little-alex-part, .fp-little-alex-chat-bubble"
      )
    );

    return (
      overlays
        .filter((overlay) => {
          const style = getComputedStyle(overlay);
          const overlayRect = overlay.getBoundingClientRect();
          const overlapX =
            Math.min(rect.right, overlayRect.right) - Math.max(rect.left, overlayRect.left);
          const overlapY =
            Math.min(rect.bottom, overlayRect.bottom) - Math.max(rect.top, overlayRect.top);

          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            overlayRect.width > 0 &&
            overlayRect.height > 0 &&
            overlapX > 1 &&
            overlapY > 1
          );
        })
        .map((overlay) => {
          const part = overlay.dataset.part ? `[data-part="${overlay.dataset.part}"]` : "";
          const testId = overlay.dataset.testid
            ? `[data-testid="${overlay.dataset.testid}"]`
            : "";

          return `${elementLabel} visually overlapped by ${overlay.tagName.toLowerCase()}${testId}${part}`;
        })[0] ?? null
    );
  }, label);

  expect(visualOverlap).toBeNull();
}

test.describe("dark mode visual QA", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      window.localStorage.setItem("fairplay:theme-mode", "dark");
    });
    await rm(screenshotDir, { force: true, recursive: true });
    await mkdir(screenshotDir, { recursive: true });
  });

  test("captures readable real app pages in dark mode", async ({ page }) => {
    await createHouseholdAndChooseAlex(page);

    for (const appPage of appPages) {
      await page.goto(appPage.path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
      await closeWelcomeIfPresent(page);
      await expect(
        page.getByRole("heading", { name: appPage.heading })
      ).toBeVisible();
      await expectReadableText(page);

      if (appPage.name === "settings") {
        await expectUnobscured(
          page.getByRole("switch", { name: "Follow system settings" }),
          "settings system theme switch"
        );
        await expectUnobscured(
          page.getByRole("button", { name: "Dark" }),
          "settings dark theme override"
        );
      }

      if (appPage.name === "load-map") {
        await expectUnobscured(
          page.getByText("Owner mix").first(),
          "load map owner mix summary"
        );
      }

      await page.screenshot({
        fullPage: true,
        path: `${screenshotDir}/${appPage.name}.png`
      });
    }
  });
});
