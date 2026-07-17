import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { GENERATED_UI_ASSETS } from "./generated-ui-assets";

const repoRoot = process.cwd();
const responsiveImageSources = [
  "public/assets/fairplay/generated-ui/backgrounds/app-shell-household-canvas.png",
  "public/assets/fairplay/generated-ui/backgrounds/auth-warm-threshold.png",
  "public/assets/fairplay/generated-ui/backgrounds/check-in-table.png",
  "public/assets/fairplay/generated-ui/backgrounds/home-learning-studio.png",
  "public/assets/fairplay/generated-ui/backgrounds/library-shelf.png",
  "public/assets/fairplay/generated-ui/backgrounds/load-map-workbench.png",
  "public/assets/fairplay/generated-ui/backgrounds/onboarding-rhythm-path.png",
  "public/assets/fairplay/generated-ui/backgrounds/settings-preferences.png",
  "public/assets/fairplay/generated-ui/login-household-garden.png"
];

describe("generated UI asset files", () => {
  it("commits every generated UI PNG with the expected dimensions", () => {
    for (const asset of GENERATED_UI_ASSETS) {
      const filePath = path.join(repoRoot, asset.outputPath);
      expect(existsSync(filePath), `${asset.slug} should exist`).toBe(true);

      const stats = statSync(filePath);
      expect(stats.size, `${asset.slug} should be non-empty`).toBeGreaterThan(0);
      expect(stats.size, `${asset.slug} should stay below 8MB`).toBeLessThan(
        8 * 1024 * 1024
      );

      const dimensions = pngDimensions(readFileSync(filePath));
      const [expectedWidth, expectedHeight] = asset.size.split("*").map(Number);
      expect(dimensions, `${asset.slug} should be a valid PNG`).toEqual({
        height: expectedHeight,
        width: expectedWidth
      });
    }
  });

  it("commits substantially smaller responsive AVIF and WebP variants", async () => {
    for (const sourcePath of responsiveImageSources) {
      const sourceBytes = statSync(path.join(repoRoot, sourcePath)).size;
      const basePath = sourcePath.replace(/\.png$/, "");

      for (const width of [768, 1536] as const) {
        for (const format of ["avif", "webp"] as const) {
          const variantPath = path.join(
            repoRoot,
            `${basePath}-${width}.${format}`
          );
          expect(existsSync(variantPath), variantPath).toBe(true);
          expect(statSync(variantPath).size, variantPath).toBeLessThan(
            sourceBytes / 4
          );

          const metadata = await sharp(variantPath).metadata();
          expect(metadata.format).toBe(format === "avif" ? "heif" : format);
          expect(metadata.width).toBe(width);
        }
      }
    }
  });
});

function pngDimensions(bytes: Uint8Array) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.byteLength < 24) {
    return null;
  }
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature[index]) {
      return null;
    }
  }
  if (
    bytes[12] !== 0x49 ||
    bytes[13] !== 0x48 ||
    bytes[14] !== 0x44 ||
    bytes[15] !== 0x52
  ) {
    return null;
  }
  return {
    height: readUint32(bytes, 20),
    width: readUint32(bytes, 16)
  };
}

function readUint32(bytes: Uint8Array, offset: number) {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}
