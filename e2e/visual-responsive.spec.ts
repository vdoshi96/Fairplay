import { expect, test, type Page } from "@playwright/test";

const visualHtml = (body: string) => `
  <!doctype html>
  <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        :root {
          --fp-ink: #20212a;
          --fp-muted-ink: #5a5e6f;
          --fp-paper: #fffdf8;
          --fp-surface: #f7f8fb;
          --fp-line: #d9dee8;
          --fp-alex: #2c8f7a;
          --fp-max: #4568d9;
          --fp-shared: #d9714a;
          --fp-helper: #f2b84b;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: var(--fp-paper);
          color: var(--fp-ink);
          font-family: ui-sans-serif, system-ui, sans-serif;
        }
        main {
          display: grid;
          gap: 16px;
          max-width: 960px;
          margin: 0 auto;
          padding: 16px 16px 88px;
        }
        header {
          position: sticky;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid var(--fp-line);
          background: rgba(255, 253, 248, .96);
          padding: 12px 16px;
        }
        img { display: block; max-width: 100%; height: auto; }
        .visual-row { display: flex; align-items: center; gap: 12px; min-width: 0; }
        .avatar { width: 40px; height: 40px; flex: 0 0 auto; }
        .hero-visual { width: min(156px, 42vw); justify-self: end; }
        .grid { display: grid; gap: 12px; }
        .two { grid-template-columns: 1fr; }
        .panel {
          border: 1px solid var(--fp-line);
          border-radius: 8px;
          background: white;
          padding: 14px;
          min-width: 0;
        }
        h1 { margin: 0; font-size: 28px; line-height: 34px; }
        h2, p { margin: 0; }
        label { display: grid; gap: 4px; font-size: 13px; color: var(--fp-muted-ink); }
        input, textarea, select, button {
          min-height: 44px;
          border: 1px solid var(--fp-line);
          border-radius: 8px;
          background: white;
          padding: 8px 10px;
          font: inherit;
          max-width: 100%;
        }
        button { background: var(--fp-ink); color: white; font-weight: 700; }
        .spark {
          width: 88px;
          height: 52px;
          border-radius: 8px;
          background:
            radial-gradient(circle at 20% 70%, var(--fp-alex) 0 6px, transparent 7px),
            radial-gradient(circle at 72% 38%, var(--fp-max) 0 6px, transparent 7px),
            radial-gradient(circle at 50% 54%, var(--fp-helper) 0 5px, transparent 6px);
        }
        @media (min-width: 720px) {
          main { padding: 24px 24px 32px; }
          .two { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
        }
      </style>
    </head>
    <body>
      <header>
        <div class="visual-row">
          <img class="avatar" src="/assets/fairplay/generated-ui/fairplay-mark.png" alt="" aria-hidden="true" />
          <strong>River Home</strong>
        </div>
        <div class="visual-row">
          <img class="avatar" src="/assets/fairplay/generated-ui/alex-avatar.png" alt="Alex avatar" />
          <span>Alex</span>
        </div>
      </header>
      ${body}
    </body>
  </html>
`;

async function mockVisualRoutes(page: Page) {
  await page.route("**/app/onboarding**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: visualHtml(`
        <main>
          <section class="grid two" aria-label="Onboarding">
            <div class="grid">
              <h1>Set up your household rhythm</h1>
              <p>Make work visible, clarify ownership, and revisit decisions calmly.</p>
            </div>
            <img class="hero-visual" src="/assets/fairplay/generated-ui/helper-mascot.png" alt="Household helper mascot" />
          </section>
          <section class="grid">
            <article class="panel"><h2>Map responsibilities</h2><p>Start in your own words.</p></article>
            <article class="panel"><h2>Plan check-ins</h2><p>Keep decisions reviewable.</p></article>
          </section>
        </main>
      `)
    });
  });
  await page.route("**/app/home**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: visualHtml(`
        <main>
          <section class="grid two">
            <div class="grid">
              <h1>Household overview</h1>
              <p>Start with a few responsibilities and keep check-ins practical.</p>
            </div>
            <div class="visual-row" role="img" aria-label="Balanced household personas">
              <img class="avatar" src="/assets/fairplay/generated-ui/alex-avatar.png" alt="Alex avatar" />
              <img class="avatar" src="/assets/fairplay/generated-ui/max-avatar.png" alt="Max avatar" />
            </div>
          </section>
          <section class="grid"><article class="panel"><h2>Load Map</h2><p>Map household work.</p></article></section>
        </main>
      `)
    });
  });
  await page.route("**/app/load-map**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: visualHtml(`
        <main>
          <section class="grid two">
            <div class="grid">
              <h1>Responsibility board</h1>
              <p>Owner mix and review timing stay scanable.</p>
            </div>
            <img class="hero-visual" src="/assets/fairplay/generated-ui/helper-mascot.png" alt="" aria-hidden="true" />
          </section>
          <section class="grid two">
            <article class="panel"><h2>Owner mix</h2><p>A 1 / M 1</p></article>
            <article class="panel"><h2>Review due</h2><p>1</p></article>
          </section>
        </main>
      `)
    });
  });
  await page.route("**/app/check-ins/new**", async (route) => {
    await route.fulfill({
      contentType: "text/html",
      body: visualHtml(`
        <main>
          <section class="grid two">
            <div class="grid">
              <h1>Schedule check-in</h1>
              <p>Pick a time, confirm it happened, and keep notes.</p>
            </div>
            <img class="hero-visual" src="/assets/fairplay/generated-ui/check-in-spark.png" alt="Check-in spark" />
          </section>
          <section class="grid panel" aria-label="Agenda preview">
            <article><h2>Meal plan review</h2><p>Review due</p></article>
            <button type="button">Start check-in</button>
          </section>
        </main>
      `)
    });
  });
}

for (const viewport of [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 900 }
] as const) {
  test(`visual responsive smoke keeps app surfaces stable at ${viewport.name}`, async ({
    page
  }) => {
    await mockVisualRoutes(page);
    await page.setViewportSize(viewport);

    for (const path of [
      "/app/onboarding",
      "/app/home",
      "/app/load-map",
      "/app/check-ins/new"
    ]) {
      await page.goto(path);
      await expect(page.locator("h1")).toBeVisible();
      await expect(page.locator("img").first()).toBeVisible();
      await expect(page.locator("body")).toHaveJSProperty("scrollTop", 0);
      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(hasHorizontalOverflow, `${path} should not overflow horizontally`).toBe(
        false
      );
      const brokenImages = await page.evaluate(() =>
        Array.from(document.images).filter((image) => image.naturalWidth === 0).length
      );
      expect(brokenImages, `${path} should load every approved visual asset`).toBe(0);
    }
  });
}
