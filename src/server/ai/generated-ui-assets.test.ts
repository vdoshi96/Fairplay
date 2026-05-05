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
        "radar-illustration",
        "check-in-spark",
        "ai-task-helper",
        "crash-course-not-chore",
        "crash-course-owner-helper",
        "crash-course-completion-celebration",
        "feature-guide-load-map",
        "feature-guide-library",
        "feature-guide-radar",
        "feature-guide-check-ins",
        "feature-guide-settings"
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
});
