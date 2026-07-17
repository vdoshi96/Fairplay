import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8"
);

describe("global background behavior", () => {
  it("uses scrolling backgrounds by default and fixes them only for desktop fine pointers", () => {
    expect(globalsCss).toMatch(
      /body\s*\{[\s\S]*?background-attachment:\s*scroll;/
    );
    expect(globalsCss).toMatch(
      /@media \(min-width: 1024px\) and \(hover: hover\) and \(pointer: fine\)\s*\{\s*body\s*\{\s*background-attachment:\s*fixed;/
    );
  });

  it("defines separate high-contrast washes for auth and operational pages", () => {
    expect(globalsCss).toContain(".fp-auth-background-wash");
    expect(globalsCss).toContain(".fp-auth-surface");
    expect(globalsCss).toContain(".fp-page-background-wash");
  });
});
