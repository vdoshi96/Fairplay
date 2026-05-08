import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts: Record<string, string>;
};
const playwrightConfig = readFileSync("playwright.config.ts", "utf8");
const prismaSchema = readFileSync("prisma/schema.prisma", "utf8");

describe("developer tooling config", () => {
  it("runs e2e tests against a production server instead of next dev", () => {
    expect(packageJson.scripts["test:e2e"]).toContain("npm run build");
    expect(playwrightConfig).toContain('command: "next start --port 3101"');
    expect(playwrightConfig).toContain("DATABASE_URL:");
    expect(playwrightConfig).toContain("SESSION_SECRET:");
    expect(playwrightConfig).toContain("reuseExistingServer: false");
    expect(playwrightConfig).not.toContain("next dev --port 3101");
  });

  it("uses an explicit local shadow database for Prisma migrate dev", () => {
    expect(prismaSchema).toContain(
      'shadowDatabaseUrl = env("SHADOW_DATABASE_URL")'
    );
    expect(packageJson.scripts["db:shadow"]).toBe(
      "node scripts/db/ensure-shadow-db.mjs"
    );
    expect(packageJson.scripts["prisma:migrate"]).toContain("npm run db:shadow");
    expect(packageJson.scripts["prisma:migrate"]).toContain(
      "SHADOW_DATABASE_URL="
    );
  });
});
