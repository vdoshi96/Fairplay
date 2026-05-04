import { expect, test, type Page } from "@playwright/test";

const personas = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    key: "alex",
    displayName: "Alex",
    avatarKey: "alex"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    key: "max",
    displayName: "Max",
    avatarKey: "max"
  }
] as const;

async function mockAuthApis(page: Page) {
  await page.route("**/api/auth/create-household", async (route) => {
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: {
        "set-cookie": "fairplay_session=mock-session; Path=/; HttpOnly; SameSite=Lax"
      },
      body: JSON.stringify({
        household: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "River Home",
          timezone: "America/Chicago"
        },
        personas,
        requiresPersonaSelection: true
      })
    });
  });
  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "set-cookie": "fairplay_session=mock-session; Path=/; HttpOnly; SameSite=Lax"
      },
      body: JSON.stringify({
        household: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "River Home"
        },
        personas,
        requiresPersonaSelection: true
      })
    });
  });
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        authenticated: true,
        household: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "River Home",
          timezone: "America/Chicago"
        },
        personas,
        selectedPersonaId: null,
        selectedPersona: null
      })
    });
  });
  await page.route("**/api/personas/select", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session: {
          householdId: "550e8400-e29b-41d4-a716-446655440000",
          selectedPersonaId: personas[0].id,
          expiresAt: "2026-05-11T12:00:00.000Z"
        }
      })
    });
  });
}

async function mockProtectedRouteHandoffs(page: Page) {
  // Keeps auth flow e2e runnable without local Postgres. Real protected UI is
  // exercised in component tests under src/components/app-shell and settings.
  await page.route("**/app/onboarding**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `<main><h1>Set up your household rhythm</h1><a href="/app/home">Skip to home</a></main>`
    });
  });
  await page.route("**/app/home**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: `<main><h1>Home</h1><p>River Home</p><button>Log out</button></main>`
    });
  });
}

async function tabUntilFocused(
  page: Page,
  locator: ReturnType<Page["locator"]>,
  attempts = 8
) {
  for (let count = 0; count < attempts; count += 1) {
    if (await locator.evaluate((element) => element === document.activeElement)) {
      return;
    }
    await page.keyboard.press("Tab");
  }
}

test.describe("auth and onboarding", () => {
  test("create household -> choose persona -> onboarding -> home", async ({ page }) => {
    await mockAuthApis(page);
    await mockProtectedRouteHandoffs(page);

    await page.goto("/create-household");
    await page.getByLabel("Household display name").fill("River Home");
    await page.getByLabel("Household username").fill("river-home");
    await page.getByLabel("Household password").fill("correct horse battery staple");
    await page.getByRole("button", { name: "Create household" }).click();

    await expect(page).toHaveURL(/\/choose-persona\?next=(%2F|\/)app(%2F|\/)onboarding/);
    await page.getByRole("button", { name: /choose Alex/i }).click();
    await expect(page).toHaveURL(/\/app\/onboarding/);
    await expect(
      page.getByRole("heading", { name: "Set up your household rhythm" })
    ).toBeVisible();
    await page.getByRole("link", { name: "Skip to home" }).click();
    await expect(page).toHaveURL(/\/app\/home/);
    await expect(page.getByRole("heading", { name: "Home" })).toBeVisible();
  });

  test("logout -> login -> choose persona -> home", async ({ page }) => {
    await mockAuthApis(page);
    await mockProtectedRouteHandoffs(page);
    await page.route("**/api/auth/logout", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "set-cookie": "fairplay_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
        },
        body: JSON.stringify({ ok: true })
      });
    });

    await page.goto("/login");
    await page.getByLabel("Household username").fill("river-home");
    await page.getByLabel("Household password").fill("correct horse battery staple");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/choose-persona\?next=(%2F|\/)app(%2F|\/)home/);
    await page.getByRole("button", { name: /choose Alex/i }).click();
    await expect(page).toHaveURL(/\/app\/home/);
  });

  test("cleared cookie redirects app home to login", async ({ page, context }) => {
    await context.clearCookies();

    await page.goto("/app/home");

    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Log in to Fairplay" })).toBeVisible();
  });

  test("keyboard smoke through login and persona screens", async ({ page }) => {
    await mockAuthApis(page);
    await mockProtectedRouteHandoffs(page);

    await page.goto("/login");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Household username")).toBeFocused();
    await page.keyboard.type("river-home");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Household password")).toBeFocused();
    await page.keyboard.type("correct horse battery staple");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Log in" })).toBeFocused();
    await page.keyboard.press("Enter");

    await expect(page).toHaveURL(/\/choose-persona/);
    const alexButton = page.getByRole("button", { name: /choose Alex/i });
    await tabUntilFocused(page, alexButton);
    await expect(alexButton).toBeFocused();
  });
});
