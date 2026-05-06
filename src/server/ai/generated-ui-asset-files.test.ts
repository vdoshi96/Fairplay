import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { GENERATED_UI_ASSETS } from "./generated-ui-assets";

const repoRoot = process.cwd();

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
