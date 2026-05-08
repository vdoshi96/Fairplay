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
const referenceSkinTone = "tone_2";
const hairColorColors = {
  dark_brown: "#553d33",
  black: "#202124",
  auburn: "#8f4632",
  blonde: "#d7b36f",
  silver: "#c8c7bc"
};
const kinds = ["full", "head"];

const options = parseArgs(process.argv.slice(2));
const manifest = {
  generatedAt: new Date().toISOString(),
  hairColorColors,
  mode: options.dryRun ? "dry-run" : "generate",
  outputDir,
  referenceSkinTone,
  source: "deterministic-sharp-hair-recolor",
  outputs: []
};

await mkdir(path.join(repoRoot, outputDir), { recursive: true });

for (const presentation of presentations) {
  for (const [hairColor, targetColor] of Object.entries(hairColorColors)) {
    for (const kind of kinds) {
      const sourcePath = path.join(
        repoRoot,
        outputDir,
        `${presentation}-${referenceSkinTone}-${kind}.png`
      );
      const outputPath = path.join(
        repoRoot,
        outputDir,
        `${presentation}-${hairColor}-${kind}-hair.png`
      );

      if (!existsSync(sourcePath)) {
        throw new Error(`Missing source Little Alex asset: ${repoRelative(sourcePath)}`);
      }

      if (options.skipExisting && existsSync(outputPath)) {
        manifest.outputs.push({
          hairColor,
          hairPixels: null,
          kind,
          outputPath: repoRelative(outputPath),
          presentation,
          skipped: true,
          sourcePath: repoRelative(sourcePath)
        });
        continue;
      }

      const result = await recolorHairLayer({
        kind,
        presentation,
        sourcePath,
        targetColor
      });

      manifest.outputs.push({
        hairColor,
        hairPixels: result.hairPixels,
        kind,
        outputPath: repoRelative(outputPath),
        presentation,
        skipped: false,
        sourcePath: repoRelative(sourcePath)
      });

      if (!options.dryRun) {
        await writeFile(outputPath, result.png);
      }
    }
  }
}

const manifestPath = path.join(outputDir, "hair-color-manifest.json");
if (!options.dryRun) {
  await writeFile(
    path.join(repoRoot, manifestPath),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
}
console.log(
  `${options.dryRun ? "Validated" : "Generated"} ${manifest.outputs.length} Little Alex hair asset records.`
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

async function recolorHairLayer({ kind, presentation, sourcePath, targetColor }) {
  const image = sharp(sourcePath).ensureAlpha();
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const candidateMask = candidateHairMask(data, info, { kind, presentation });
  const hairOffsets = refineHairOffsets(
    largestRootedHairComponent(candidateMask, info),
    info,
    { kind, presentation }
  );

  if (hairOffsets.length < 400) {
    throw new Error(
      `Could not isolate enough hair pixels in ${repoRelative(sourcePath)} (${hairOffsets.length})`
    );
  }

  const target = hexToRgb(targetColor);
  const base = averageColor(data, hairOffsets);
  const baseLuminance = Math.max(luminance(base), 1);
  const output = Buffer.alloc(data.length);

  for (const offset of hairOffsets) {
    const source = {
      blue: data[offset + 2],
      green: data[offset + 1],
      red: data[offset]
    };
    const shade = clamp(luminance(source) / baseLuminance, 0.52, 1.48);

    output[offset] = channel(target.red, shade, source.red);
    output[offset + 1] = channel(target.green, shade, source.green);
    output[offset + 2] = channel(target.blue, shade, source.blue);
    output[offset + 3] = data[offset + 3];
  }

  return {
    hairPixels: hairOffsets.length,
    png: await sharp(output, {
      raw: {
        channels: 4,
        height: info.height,
        width: info.width
      }
    })
      .png()
      .toBuffer()
  };
}

function candidateHairMask(data, info, { kind, presentation }) {
  const mask = new Uint8Array(info.width * info.height);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (!isInBroadHairRegion({ height: info.height, kind, presentation, y })) {
        continue;
      }

      const pixelIndex = y * info.width + x;
      const offset = pixelIndex * 4;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      const alpha = data[offset + 3];

      if (isHairPixelCandidate({ alpha, blue, green, red })) {
        mask[pixelIndex] = 1;
      }
    }
  }

  return mask;
}

function isInBroadHairRegion({ height, kind, presentation, y }) {
  if (kind === "full") {
    if (presentation === "feminine") {
      return y <= height * 0.46;
    }

    return y <= height * 0.22;
  }

  if (presentation === "feminine") {
    return y <= height * 0.98;
  }

  return y <= height * 0.65;
}

function refineHairOffsets(offsets, info, { kind, presentation }) {
  if (kind !== "full" || presentation !== "feminine") {
    return offsets;
  }

  return offsets.filter((offset) => {
    const pixelIndex = offset / 4;
    const x = pixelIndex % info.width;
    const y = Math.floor(pixelIndex / info.width);

    return (
      y <= info.height * 0.28 ||
      x <= info.width * 0.28 ||
      x >= info.width * 0.72
    );
  });
}

function isHairPixelCandidate({ alpha, blue, green, red }) {
  if (alpha < 40) {
    return false;
  }

  const brightness = luminance({ blue, green, red });
  const spread = Math.max(red, green, blue) - Math.min(red, green, blue);

  return (
    brightness >= 30 &&
    brightness <= 170 &&
    spread <= 64 &&
    red <= 150 &&
    green <= 150 &&
    blue <= 150
  );
}

function largestRootedHairComponent(mask, info) {
  const seen = new Uint8Array(mask.length);
  const queue = new Int32Array(mask.length);
  let best = null;
  const rootedTopLimit = Math.max(24, info.height * 0.09);

  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || seen[start]) {
      continue;
    }

    let area = 0;
    let head = 0;
    let tail = 0;
    let top = info.height;
    const offsets = [];
    seen[start] = 1;
    queue[tail] = start;
    tail += 1;

    while (head < tail) {
      const index = queue[head];
      head += 1;
      const x = index % info.width;
      const y = Math.floor(index / info.width);
      area += 1;
      top = Math.min(top, y);
      offsets.push(index * 4);

      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }

          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= info.width || ny >= info.height) {
            continue;
          }

          const nextIndex = ny * info.width + nx;
          if (mask[nextIndex] && !seen[nextIndex]) {
            seen[nextIndex] = 1;
            queue[tail] = nextIndex;
            tail += 1;
          }
        }
      }
    }

    if (top <= rootedTopLimit && (!best || area > best.area)) {
      best = { area, offsets, top };
    }
  }

  return best?.offsets ?? [];
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
  return Math.round(clamp(target * shade * 0.9 + source * 0.1, 0, 255));
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
