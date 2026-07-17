import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readAppCss(path: string) {
  return readFileSync(resolve(process.cwd(), "src/app", path), "utf8");
}

const globalsCss = readAppCss("globals.css");
const tailwindCss = readAppCss("styles/tailwind.css");
const tokensThemeCss = readAppCss("styles/tokens-theme.css");
const shellBackgroundCss = readAppCss("styles/shell-background.css");
const motionCss = readAppCss("styles/motion.css");
const littleAlexCss = readAppCss("styles/little-alex.css");
const motionPreferencesCss = readAppCss("styles/motion-preferences.css");

describe("global style layers", () => {
  it("loads Tailwind and Fairplay concerns in cascade-preserving order", () => {
    expect(globalsCss.trim().split("\n")).toEqual([
      '@import "./styles/tailwind.css";',
      '@import "./styles/tokens-theme.css";',
      '@import "./styles/shell-background.css";',
      '@import "./styles/motion.css";',
      '@import "./styles/little-alex.css";',
      '@import "./styles/motion-preferences.css";'
    ]);
    expect(tailwindCss).toContain("@tailwind base;");
    expect(tailwindCss).toContain("@tailwind components;");
    expect(shellBackgroundCss).toMatch(
      /^@tailwind utilities;\s+@layer utilities \{/
    );
  });

  it("keeps tokens and dark-theme overrides in the theme layer", () => {
    expect(tokensThemeCss).toContain(":root {");
    expect(tokensThemeCss).toContain('html[data-theme="dark"]');
    expect(tokensThemeCss).toContain("--fp-app-content-bottom-padding");
  });

  it("uses scrolling backgrounds by default and fixes them only for desktop fine pointers", () => {
    expect(shellBackgroundCss).toMatch(
      /body\s*\{[\s\S]*?background-attachment:\s*scroll;/
    );
    expect(shellBackgroundCss).toMatch(
      /@media \(min-width: 1024px\) and \(hover: hover\) and \(pointer: fine\)\s*\{\s*body\s*\{\s*background-attachment:\s*fixed;/
    );
  });

  it("defines separate high-contrast washes for auth and operational pages", () => {
    expect(shellBackgroundCss).toContain(".fp-auth-background-wash");
    expect(shellBackgroundCss).toContain(".fp-auth-surface");
    expect(shellBackgroundCss).toContain(".fp-page-background-wash");
  });

  it("keeps reusable motion, Little Alex, and the final reduced-motion guard isolated", () => {
    expect(motionCss).toContain("@keyframes fp-panel-enter");
    expect(motionCss).toContain(".fp-motion-panel-enter");
    expect(littleAlexCss).toContain(".fp-little-alex-shell");
    expect(littleAlexCss).toContain(".fp-little-alex-full-sprite");
    expect(motionPreferencesCss).toContain(
      "@media (prefers-reduced-motion: reduce)"
    );
    expect(motionPreferencesCss).toContain("transition-duration: 0.01ms !important");
  });
});
