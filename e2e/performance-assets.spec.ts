import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { devices, expect, test, type Page } from "@playwright/test";

function findJavaScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);

    return entry.isDirectory()
      ? findJavaScriptFiles(entryPath)
      : entry.name.endsWith(".js")
        ? [entryPath]
        : [];
  });
}

function matterChunkNames() {
  const chunksDirectory = path.resolve(process.cwd(), ".next/static/chunks");

  return findJavaScriptFiles(chunksDirectory)
    .filter((file) => {
      const source = readFileSync(file, "utf8");

      return source.includes("matter-js") || source.includes("Matter.Engine");
    })
    .map((file) => path.basename(file));
}

function uniqueHouseholdSlug() {
  return `performance-assets-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
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

test("mobile requests responsive artwork and optimized covers without loading Matter.js", async ({
  browser
}, testInfo) => {
  const context = await browser.newContext({
    ...devices["iPhone 13"],
    baseURL: String(testInfo.project.use.baseURL ?? "http://localhost:3101")
  });
  const page = await context.newPage();
  const requestedUrls: string[] = [];

  page.on("request", (request) => requestedUrls.push(request.url()));

  try {
    const physicsChunks = matterChunkNames();
    expect(physicsChunks.length).toBeGreaterThan(0);

    await page.goto("/create-household");
    const authBackground = page.getByTestId("auth-responsive-background");

    await expect(authBackground).toBeVisible();
    expect(
      await authBackground.evaluate((element) =>
        element.style.getPropertyValue("--fp-background-mobile")
      )
    ).toContain("auth-warm-threshold-768.avif");
    await expect
      .poll(() =>
        requestedUrls.some((url) =>
          /auth-warm-threshold-(768|1536)\.(avif|webp)/.test(url)
        )
      )
      .toBe(true);

    await page.getByLabel("Household display name").fill("Performance QA Home");
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

    const optimizedCover = page.waitForResponse((response) => {
      const url = new URL(response.url());
      const source = url.searchParams.get("url");

      return (
        url.pathname === "/_next/image" &&
        Boolean(source?.startsWith("/assets/fairplay/cards/"))
      );
    });

    await page.goto("/app/distribute");
    await expect(
      page.getByRole("heading", { name: "Deal the next card" })
    ).toBeVisible();

    const coverResponse = await optimizedCover;
    expect(coverResponse.ok()).toBe(true);
    expect(coverResponse.headers()["content-type"]).toMatch(/^image\//);
    const availableCardsToggle = page.getByRole("button", {
      name: /^Show \d+$/
    });
    await expect(availableCardsToggle).toHaveAttribute("aria-expanded", "false");
    await availableCardsToggle.click();
    await expect(page.getByTestId("available-card-row")).toHaveCount(20);

    for (const physicsChunk of physicsChunks) {
      expect(requestedUrls.some((url) => url.includes(physicsChunk))).toBe(
        false
      );
    }
  } finally {
    await context.close();
  }
});
