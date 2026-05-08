import { defineConfig, devices } from "@playwright/test";

const e2eBaseUrl = "http://localhost:3101";
const e2eDatabaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay?schema=public";
const e2eShadowDatabaseUrl =
  process.env.SHADOW_DATABASE_URL ??
  "postgresql://fairplay:fairplay_local_password@localhost:5432/fairplay_shadow?schema=public";
const e2eSessionSecret =
  process.env.SESSION_SECRET ??
  "fairplay-e2e-session-secret-with-at-least-32-bytes";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: e2eBaseUrl,
    trace: "on-first-retry"
  },
  webServer: {
    command: "next start --port 3101",
    env: {
      ...process.env,
      APP_BASE_URL: e2eBaseUrl,
      DATABASE_URL: e2eDatabaseUrl,
      SESSION_SECRET: e2eSessionSecret,
      SHADOW_DATABASE_URL: e2eShadowDatabaseUrl
    },
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
