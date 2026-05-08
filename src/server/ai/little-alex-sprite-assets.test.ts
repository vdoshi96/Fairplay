import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  LITTLE_ALEX_SPRITE_ASSETS,
  LITTLE_ALEX_SPRITE_CELL_HEIGHT,
  LITTLE_ALEX_SPRITE_CELL_ORDER,
  LITTLE_ALEX_SPRITE_CELL_WIDTH,
  LITTLE_ALEX_SPRITE_OUTPUT_DIR,
  LITTLE_ALEX_SPRITE_PARTS,
  LITTLE_ALEX_SPRITE_PRESENTATIONS,
  LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE,
  LITTLE_ALEX_SPRITE_QWEN_MODEL,
  LITTLE_ALEX_SPRITE_SHEETS,
  LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR,
  LITTLE_ALEX_SPRITE_SHEET_SIZE,
  buildLittleAlexSpritePrompt,
  littleAlexSpriteNegativePrompt
} from "./little-alex-sprite-assets";

const littleAlexSkinTones = ["tone_1", "tone_2", "tone_3", "tone_4", "tone_5"];
const littleAlexHairColors = [
  "dark_brown",
  "black",
  "auburn",
  "blonde",
  "silver"
];

describe("Little Alex sprite asset specs", () => {
  it("defines three source sheets and one cropped transparent PNG spec for each body part", () => {
    expect(LITTLE_ALEX_SPRITE_OUTPUT_DIR).toBe(
      "public/assets/fairplay/little-alex-sprites"
    );
    expect(LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR).toBe(
      "public/assets/fairplay/little-alex-sprites/source-sheets"
    );
    expect(LITTLE_ALEX_SPRITE_QWEN_MODEL).toBe("qwen-image-2.0-pro");
    expect(LITTLE_ALEX_SPRITE_SHEET_SIZE).toBe("1536*1024");
    expect(LITTLE_ALEX_SPRITE_CELL_WIDTH).toBe(512);
    expect(LITTLE_ALEX_SPRITE_CELL_HEIGHT).toBe(512);
    expect(LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE.slug).toBe(
      "fairplay-little-alex-original-proportion-template-v1"
    );
    expect(LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE.documentationPath).toBe(
      "docs/assets/little-alex-proportion-template.svg"
    );
    expect(LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE.provenance).toMatch(
      /no internet image/i
    );
    expect(LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE.license).toMatch(
      /No external license applies/i
    );
    expect(LITTLE_ALEX_SPRITE_PRESENTATIONS).toEqual([
      "neutral",
      "masculine",
      "feminine"
    ]);
    expect(LITTLE_ALEX_SPRITE_PARTS).toEqual([
      "head",
      "torso",
      "leftArm",
      "rightArm",
      "leftLeg",
      "rightLeg"
    ]);
    expect(LITTLE_ALEX_SPRITE_CELL_ORDER.map((cell) => cell.part)).toEqual(
      LITTLE_ALEX_SPRITE_PARTS
    );
    expect(LITTLE_ALEX_SPRITE_CELL_ORDER.map(({ column, row }) => [row, column])).toEqual([
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [1, 2]
    ]);
    expect(LITTLE_ALEX_SPRITE_SHEETS.map((sheet) => sheet.slug)).toEqual([
      "neutral-sheet",
      "masculine-sheet",
      "feminine-sheet"
    ]);
    expect(LITTLE_ALEX_SPRITE_ASSETS).toHaveLength(18);

    const expectedSlugs = LITTLE_ALEX_SPRITE_PRESENTATIONS.flatMap(
      (presentation) =>
        LITTLE_ALEX_SPRITE_PARTS.map((part) => `${presentation}-${part}`)
    );

    expect(LITTLE_ALEX_SPRITE_ASSETS.map((asset) => asset.slug)).toEqual(
      expectedSlugs
    );

    for (const asset of LITTLE_ALEX_SPRITE_ASSETS) {
      expect(asset.outputPath).toBe(
        `${LITTLE_ALEX_SPRITE_OUTPUT_DIR}/${asset.slug}.png`
      );
      expect(asset.size).toBe("512*512");
      expect(asset.crop.width).toBe(LITTLE_ALEX_SPRITE_CELL_WIDTH);
      expect(asset.crop.height).toBe(LITTLE_ALEX_SPRITE_CELL_HEIGHT);
      expect(asset.sourceSheetSlug).toBe(`${asset.presentation}-sheet`);
    }

    for (const sheet of LITTLE_ALEX_SPRITE_SHEETS) {
      expect(sheet.proportionTemplate).toBe(LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE);
    }
  });

  it("builds original flat 2D sheet prompts with matching-part and crop instructions", () => {
    const feminineSheet = LITTLE_ALEX_SPRITE_SHEETS.find(
      (sheet) => sheet.slug === "feminine-sheet"
    );
    const neutralSheet = LITTLE_ALEX_SPRITE_SHEETS.find(
      (sheet) => sheet.slug === "neutral-sheet"
    );
    const masculineSheet = LITTLE_ALEX_SPRITE_SHEETS.find(
      (sheet) => sheet.slug === "masculine-sheet"
    );

    expect(feminineSheet).toBeDefined();
    expect(neutralSheet).toBeDefined();
    expect(masculineSheet).toBeDefined();

    const prompt = buildLittleAlexSpritePrompt(feminineSheet!);

    expect(prompt).toContain("Original Fairplay app sidekick sprite sheet");
    expect(prompt).toContain("cute flat 2D");
    expect(prompt).toContain(
      "fairplay-little-alex-original-proportion-template-v1"
    );
    expect(prompt).toContain("no internet image reference");
    expect(prompt).toContain("no third-party mannequin");
    expect(prompt).toContain("single complete original character");
    expect(prompt).toContain("equal left and right limb proportions");
    expect(prompt).toContain("leftArm and rightArm cells must match");
    expect(prompt).toContain("leftLeg and rightLeg cells must match");
    expect(prompt).toContain("strict 3x2 grid");
    expect(prompt).toContain("paper-doll source sheet");
    expect(prompt).toContain("row 1 cell 1 contains head only");
    expect(prompt).toContain("row 2 cell 3 contains detached right leg only");
    expect(prompt).toContain("Never draw a complete assembled person");
    expect(prompt).toContain("all six parts belong to the same original character");
    expect(prompt).toContain("identical skin tone");
    expect(prompt).toContain("black suit fabric");
    expect(prompt).toContain("white shirt");
    expect(prompt).toContain("clipboard style");
    expect(prompt).toContain("pure chroma green background");
    expect(prompt).toMatch(/long hair/i);
    expect(prompt).not.toMatch(/Alex Honnold|Taskmaster|celebrity style/i);
    expect(neutralSheet!.promptSubject).not.toBe(masculineSheet!.promptSubject);
    expect(littleAlexSpriteNegativePrompt).toMatch(/photorealistic/);
    expect(littleAlexSpriteNegativePrompt).toMatch(/real-person likeness/);
    expect(littleAlexSpriteNegativePrompt).toMatch(/internet image reference/);
    expect(littleAlexSpriteNegativePrompt).toMatch(/unequal left and right limbs/);
  });

  it("has generated tone-aware full-body and ragdoll part assets", () => {
    for (const presentation of LITTLE_ALEX_SPRITE_PRESENTATIONS) {
      for (const skinTone of littleAlexSkinTones) {
        expect(
          existsSync(
            `${LITTLE_ALEX_SPRITE_OUTPUT_DIR}/${presentation}-${skinTone}-full.png`
          ),
          `${presentation} ${skinTone} full-body sprite is missing`
        ).toBe(true);

        for (const part of LITTLE_ALEX_SPRITE_PARTS) {
          expect(
            existsSync(
              `${LITTLE_ALEX_SPRITE_OUTPUT_DIR}/${presentation}-${skinTone}-${part}.png`
            ),
            `${presentation} ${skinTone} ${part} sprite is missing`
          ).toBe(true);
        }
      }
    }
  });

  it("has generated hair-color full-body and head assets", () => {
    for (const presentation of LITTLE_ALEX_SPRITE_PRESENTATIONS) {
      for (const hairColor of littleAlexHairColors) {
        for (const kind of ["full", "head"]) {
          expect(
            existsSync(
              `${LITTLE_ALEX_SPRITE_OUTPUT_DIR}/${presentation}-${hairColor}-${kind}-hair.png`
            ),
            `${presentation} ${hairColor} ${kind} hair layer is missing`
          ).toBe(true);
        }
      }
    }
  });
});
