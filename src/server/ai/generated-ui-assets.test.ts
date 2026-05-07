import { describe, expect, it } from "vitest";

import {
  GENERATED_UI_ASSETS,
  GENERATED_UI_ASSET_OUTPUT_DIR,
  GENERATED_UI_QWEN_MODEL,
  buildGeneratedUiAssetPrompt,
  generatedUiAssetNegativePrompt
} from "./generated-ui-assets";

describe("generated UI asset specs", () => {
  it("keeps generated UI assets separate from reference card covers", () => {
    expect(GENERATED_UI_ASSET_OUTPUT_DIR).toBe(
      "public/assets/fairplay/generated-ui"
    );
    expect(GENERATED_UI_QWEN_MODEL).toBe("qwen-image-2.0-pro");
    expect(GENERATED_UI_ASSETS.length).toBeGreaterThan(12);

    for (const asset of GENERATED_UI_ASSETS) {
      expect(asset.outputPath).toMatch(
        /^public\/assets\/fairplay\/generated-ui\/.+\.png$/
      );
      expect(asset.outputPath).not.toContain("/cards/");
      expect(asset.size).toMatch(/^\d+\*\d+$/);
      expect(asset.promptSubject).not.toMatch(/readable text|logo/i);
    }
  });

  it("contains the high-value non-card UI surfaces", () => {
    expect(GENERATED_UI_ASSETS.map((asset) => asset.slug)).toEqual(
      expect.arrayContaining([
        "login-household-garden",
        "alex-avatar",
        "max-avatar",
        "helper-mascot",
        "fairplay-mark",
        "check-in-spark",
        "ai-task-helper",
        "greg-taskmaster-avatar",
        "crash-course-hidden-load-entry",
        "crash-course-visible-reminder",
        "crash-course-treadmill-reset",
        "crash-course-active-set",
        "crash-course-helper-owner",
        "crash-course-cpe-outcome",
        "crash-course-done-standard",
        "crash-course-standard-autonomy",
        "crash-course-handoff-context",
        "crash-course-load-map",
        "crash-course-capacity-shift",
        "crash-course-check-in-signal",
        "crash-course-repair-loop",
        "crash-course-next-move",
        "crash-course-completion-celebration",
        "feature-guide-load-map",
        "feature-guide-library",
        "feature-guide-check-ins",
        "feature-guide-settings",
        "auth-warm-threshold-background",
        "app-shell-household-canvas",
        "home-learning-studio-background",
        "onboarding-rhythm-path-background",
        "load-map-workbench-background",
        "library-shelf-background",
        "check-in-table-background",
        "settings-preferences-background"
      ])
    );
  });

  it("builds original flat 2D prompts without unapproved model language", () => {
    const asset = GENERATED_UI_ASSETS.find(
      (candidate) => candidate.slug === "ai-task-helper"
    );

    expect(asset).toBeDefined();
    const prompt = buildGeneratedUiAssetPrompt(asset!);

    expect(prompt).toContain("Original Fairplay app illustration");
    expect(prompt).toContain("cute flat 2D cartoon");
    expect(prompt).toContain("no readable text");
    expect(prompt).not.toMatch(/gpt-image-2|Taskmaster|celebrity/i);
    expect(generatedUiAssetNegativePrompt).toMatch(/readable text/);
    expect(generatedUiAssetNegativePrompt).toMatch(/real-person likeness/);
  });

  it("keeps crash-course course text as provenance instead of drawable prompt text", () => {
    const crashCourseAssets = GENERATED_UI_ASSETS.filter(
      (asset) =>
        asset.slug.startsWith("crash-course-") &&
        asset.slug !== "crash-course-completion-celebration"
    );

    expect(crashCourseAssets).toHaveLength(14);
    for (const asset of crashCourseAssets) {
      expect(asset.courseText).toBeTruthy();
      const prompt = buildGeneratedUiAssetPrompt(asset);

      expect(prompt).toContain("Silent storyboard rule");
      expect(prompt).not.toContain("Accessibility intent");
      expect(prompt).not.toContain(asset.courseText as string);
    }
  });
});
