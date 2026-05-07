#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const outputDir = "public/assets/fairplay/little-alex-sprites";
const presentations = ["neutral", "masculine", "feminine"];
const parts = ["head", "torso", "leftArm", "rightArm", "leftLeg", "rightLeg"];
const skinToneColors = {
  tone_1: "#f3c7a6",
  tone_2: "#d8a078",
  tone_3: "#c18463",
  tone_4: "#b7795f",
  tone_5: "#8f5f45"
};
const recolorableKinds = new Set(["full", "head", "leftArm", "rightArm"]);

const options = parseArgs(process.argv.slice(2));
const manifest = {
  generatedAt: new Date().toISOString(),
  mode: options.dryRun ? "dry-run" : "generate",
  outputDir,
  source: "deterministic-sharp-skin-recolor",
  skinToneColors,
  outputs: []
};

await mkdir(path.join(repoRoot, outputDir), { recursive: true });

for (const presentation of presentations) {
  for (const [skinTone, targetColor] of Object.entries(skinToneColors)) {
    for (const kind of ["full", ...parts]) {
      const sourcePath = path.join(repoRoot, outputDir, `${presentation}-${kind}.png`);
      const outputPath = path.join(
        repoRoot,
        outputDir,
        `${presentation}-${skinTone}-${kind}.png`
      );

      if (!existsSync(sourcePath)) {
        throw new Error(`Missing source Little Alex asset: ${repoRelative(sourcePath)}`);
      }

      if (options.skipExisting && existsSync(outputPath)) {
        manifest.outputs.push({
          kind,
          outputPath: repoRelative(outputPath),
          presentation,
          skinPixels: null,
          skinTone,
          skipped: true,
          sourcePath: repoRelative(sourcePath)
        });
        continue;
      }

      const result = await recolorAsset({
        kind,
        sourcePath,
        targetColor
      });

      manifest.outputs.push({
        kind,
        outputPath: repoRelative(outputPath),
        presentation,
        skinPixels: result.skinPixels,
        skinTone,
        skipped: false,
        sourcePath: repoRelative(sourcePath)
      });

      if (!options.dryRun) {
        await writeFile(outputPath, result.png);
      }
    }
  }
}

const manifestPath = path.join(repoRoot, outputDir, "skin-tone-manifest.json");
if (!options.dryRun) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(
  `${options.dryRun ? "Validated" : "Generated"} ${manifest.outputs.length} Little Alex tone asset records.`
);

function parseArgs(args) {
  const parsed = {
    dryRun: false,
    skipExisting: false
  };

  for (const arg of args) {
    if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--skip-existing") {
      parsed.skipExisting = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

async function recolorAsset({ kind, sourcePath, targetColor }) {
  const image = sharp(sourcePath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const target = hexToRgb(targetColor);
  const skinPixels = [];

  if (recolorableKinds.has(kind)) {
    for (let offset = 0; offset < data.length; offset += 4) {
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const alpha = data[offset + 3];

      if (isSkinPixel({ alpha, blue, green, red })) {
        skinPixels.push(offset);
      }
    }
  }

  if (skinPixels.length > 0) {
    const base = averageColor(data, skinPixels);
    const baseLuminance = Math.max(luminance(base), 1);

    for (const offset of skinPixels) {
      const source = {
        blue: data[offset + 2],
        green: data[offset + 1],
        red: data[offset]
      };
      const shade = clamp(luminance(source) / baseLuminance, 0.62, 1.34);

      data[offset] = channel(target.red, shade, source.red);
      data[offset + 1] = channel(target.green, shade, source.green);
      data[offset + 2] = channel(target.blue, shade, source.blue);
    }
  }

  return {
    png: await sharp(data, {
      raw: {
        channels: 4,
        height: info.height,
        width: info.width
      }
    })
      .png()
      .toBuffer(),
    skinPixels: skinPixels.length
  };
}

function isSkinPixel({ alpha, blue, green, red }) {
  if (alpha < 36) {
    return false;
  }

  return (
    red >= 120 &&
    green >= 70 &&
    blue >= 48 &&
    red > green + 6 &&
    green >= blue - 4 &&
    red - blue >= 30 &&
    green - blue <= 42 &&
    red - green <= 76
  );
}

function averageColor(data, offsets) {
  const total = offsets.reduce(
    (sum, offset) => ({
      blue: sum.blue + data[offset + 2],
      green: sum.green + data[offset + 1],
      red: sum.red + data[offset]
    }),
    { blue: 0, green: 0, red: 0 }
  );

  return {
    blue: total.blue / offsets.length,
    green: total.green / offsets.length,
    red: total.red / offsets.length
  };
}

function channel(target, shade, source) {
  return Math.round(clamp(target * shade * 0.92 + source * 0.08, 0, 255));
}

function luminance({ blue, green, red }) {
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");

  return {
    blue: Number.parseInt(normalized.slice(4, 6), 16),
    green: Number.parseInt(normalized.slice(2, 4), 16),
    red: Number.parseInt(normalized.slice(0, 2), 16)
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath);
}
