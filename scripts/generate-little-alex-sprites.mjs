#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

class ProviderHttpError extends Error {
  constructor(message, { status }) {
    super(message);
    this.name = "ProviderHttpError";
    this.status = status;
  }
}

const [
  {
    LITTLE_ALEX_SPRITE_ASSETS,
    LITTLE_ALEX_SPRITE_OUTPUT_DIR,
    LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE,
    LITTLE_ALEX_SPRITE_QWEN_MODEL,
    LITTLE_ALEX_SPRITE_SHEETS,
    LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR,
    LITTLE_ALEX_SPRITE_SHEET_SIZE,
    buildLittleAlexSpritePrompt,
    littleAlexSpriteNegativePrompt
  },
  { isApprovedQwenImageModel }
] = await Promise.all([
  importTs("src/server/ai/little-alex-sprite-assets.ts"),
  importTs("src/server/ai/approved-image-models.ts")
]);

const options = parseArgs(process.argv.slice(2));
loadLocalEnv(path.join(repoRoot, ".env.local"));
if (process.env.FAIRPLAY_ENV_FILE) {
  loadLocalEnv(resolveUserPath(process.env.FAIRPLAY_ENV_FILE));
}
if (options.envFile) {
  loadLocalEnv(resolveUserPath(options.envFile));
}

const selectedSheets = selectSheets({
  assets: LITTLE_ALEX_SPRITE_ASSETS,
  options,
  sheets: LITTLE_ALEX_SPRITE_SHEETS
});
const outputRoot = path.resolve(repoRoot, options.outputDir);
const sourceSheetRoot = path.resolve(repoRoot, options.sourceSheetDir);
const manifest = {
  generatedAt: new Date().toISOString(),
  mode: options.dryRun ? "dry-run" : "generate",
  approvedModel: LITTLE_ALEX_SPRITE_QWEN_MODEL,
  outputDir: repoRelative(outputRoot),
  proportionTemplate: LITTLE_ALEX_SPRITE_PROPORTION_TEMPLATE,
  sourceSheetDir: repoRelative(sourceSheetRoot),
  sheetSize: LITTLE_ALEX_SPRITE_SHEET_SIZE,
  sheets: []
};

await mkdir(outputRoot, { recursive: true });
await mkdir(sourceSheetRoot, { recursive: true });

const provider = needsProvider(selectedSheets, options)
  ? resolveQwenProvider()
  : null;

if (provider) {
  console.log(
    `Generating ${selectedSheets.length} Little Alex source sheet(s) with ${provider.model}.`
  );
} else if (!options.dryRun) {
  console.log("All selected Little Alex source sheets already exist; skipping provider setup.");
}

for (const sheet of selectedSheets) {
  const prompt = buildLittleAlexSpritePrompt(sheet);
  const sourceSheetPath = resolveSheetOutputPath(sourceSheetRoot, sheet);
  const selectedAssets = selectedAssetsForSheet(sheet, options);
  const sheetRecord = {
    alt: sheet.alt,
    negativePrompt: littleAlexSpriteNegativePrompt,
    outputPath: repoRelative(sourceSheetPath),
    presentation: sheet.presentation,
    prompt,
    proportionTemplate: sheet.proportionTemplate,
    size: sheet.size,
    skippedGeneration: false,
    slug: sheet.slug,
    sprites: []
  };
  manifest.sheets.push(sheetRecord);

  for (const asset of selectedAssets) {
    sheetRecord.sprites.push({
      crop: asset.crop,
      outputPath: repoRelative(resolveAssetOutputPath(outputRoot, asset)),
      part: asset.part,
      slug: asset.slug
    });
  }

  if (options.dryRun) {
    continue;
  }

  const shouldGenerateSheet =
    !existsSync(sourceSheetPath) ||
    (!options.skipExisting && !options.reuseSourceSheets);
  if (shouldGenerateSheet) {
    const imageBytes = await generateWithQwen({
      negativePrompt: littleAlexSpriteNegativePrompt,
      options,
      prompt,
      provider,
      size: sheet.size
    });
    sheetRecord.qa = await validateSheetImage(imageBytes, sheet);
    await mkdir(path.dirname(sourceSheetPath), { recursive: true });
    await writeFile(sourceSheetPath, imageBytes);
    console.log(`Wrote ${path.relative(repoRoot, sourceSheetPath)}`);
  } else {
    sheetRecord.skippedGeneration = true;
    sheetRecord.qa = await validateSheetFile(sourceSheetPath, sheet);
    console.log(`Using existing ${path.relative(repoRoot, sourceSheetPath)}`);
  }

  for (const asset of selectedAssets) {
    const outputPath = resolveAssetOutputPath(outputRoot, asset);
    if (options.skipExisting && existsSync(outputPath)) {
      updateSpriteRecord(sheetRecord, asset.slug, { skipped: true });
      console.log(`Skipped existing ${path.relative(repoRoot, outputPath)}`);
      continue;
    }

    await mkdir(path.dirname(outputPath), { recursive: true });
    const { png, qa } = await cropTransparentSprite(sourceSheetPath, asset);
    await writeFile(outputPath, png);
    updateSpriteRecord(sheetRecord, asset.slug, { qa, skipped: false });
    console.log(
      `Wrote ${path.relative(repoRoot, outputPath)} (${qa.width}x${qa.height}, alpha pixels ${qa.transparentPixels})`
    );
  }

  if (provider && options.delayMs > 0) {
    await sleep(options.delayMs);
  }
}

const manifestPath = path.join(outputRoot, "generation-manifest.json");
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${path.relative(repoRoot, manifestPath)}`);

function importTs(relativePath) {
  return import(pathToFileURL(path.join(repoRoot, relativePath)).href);
}

function parseArgs(args) {
  const options = {
    delayMs: 12000,
    dryRun: false,
    envFile: null,
    outputDir: LITTLE_ALEX_SPRITE_OUTPUT_DIR,
    reuseSourceSheets: false,
    skipExisting: false,
    slugs: null,
    sourceSheetDir: LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-existing") {
      options.skipExisting = true;
    } else if (arg === "--reuse-source-sheets") {
      options.reuseSourceSheets = true;
    } else if (arg === "--delay-ms") {
      options.delayMs = Number(args[++index]);
    } else if (arg.startsWith("--delay-ms=")) {
      options.delayMs = Number(arg.slice("--delay-ms=".length));
    } else if (arg === "--env-file") {
      options.envFile = args[++index];
    } else if (arg.startsWith("--env-file=")) {
      options.envFile = arg.slice("--env-file=".length);
    } else if (arg === "--slugs") {
      options.slugs = splitList(args[++index]);
    } else if (arg.startsWith("--slugs=")) {
      options.slugs = splitList(arg.slice("--slugs=".length));
    } else if (arg === "--output-dir") {
      options.outputDir = args[++index];
    } else if (arg.startsWith("--output-dir=")) {
      options.outputDir = arg.slice("--output-dir=".length);
    } else if (arg === "--source-sheet-dir") {
      options.sourceSheetDir = args[++index];
    } else if (arg.startsWith("--source-sheet-dir=")) {
      options.sourceSheetDir = arg.slice("--source-sheet-dir=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.delayMs) || options.delayMs < 0) {
    throw new Error("--delay-ms must be a non-negative integer.");
  }

  return options;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function selectSheets({ assets, options, sheets }) {
  if (!options.slugs?.length) {
    return [...sheets];
  }

  const wanted = new Set(options.slugs);
  const selectedSheetSlugs = new Set();
  const known = new Set([
    ...sheets.map((sheet) => sheet.slug),
    ...sheets.map((sheet) => sheet.presentation),
    ...assets.map((asset) => asset.slug)
  ]);

  for (const slug of wanted) {
    if (!known.has(slug)) {
      throw new Error(`Unknown Little Alex sprite slug or presentation: ${slug}`);
    }

    const sheet = sheets.find(
      (candidate) => candidate.slug === slug || candidate.presentation === slug
    );
    if (sheet) {
      selectedSheetSlugs.add(sheet.slug);
      continue;
    }

    const asset = assets.find((candidate) => candidate.slug === slug);
    if (asset) {
      selectedSheetSlugs.add(asset.sourceSheetSlug);
    }
  }

  return sheets.filter((sheet) => selectedSheetSlugs.has(sheet.slug));
}

function selectedAssetsForSheet(sheet, options) {
  const assetsForSheet = LITTLE_ALEX_SPRITE_ASSETS.filter(
    (asset) => asset.sourceSheetSlug === sheet.slug
  );

  if (!options.slugs?.length) {
    return assetsForSheet;
  }

  const wanted = new Set(options.slugs);
  const selectedWholeSheet = wanted.has(sheet.slug) || wanted.has(sheet.presentation);
  if (selectedWholeSheet) {
    return assetsForSheet;
  }

  return assetsForSheet.filter((asset) => wanted.has(asset.slug));
}

function needsProvider(sheets, options) {
  if (options.dryRun) {
    return false;
  }

  if (!options.skipExisting && !options.reuseSourceSheets) {
    return sheets.length > 0;
  }

  const sourceSheetRoot = path.resolve(repoRoot, options.sourceSheetDir);
  return sheets.some((sheet) => !existsSync(resolveSheetOutputPath(sourceSheetRoot, sheet)));
}

function resolveSheetOutputPath(sourceSheetRoot, sheet) {
  const relativeOutputPath = path.relative(
    LITTLE_ALEX_SPRITE_SHEET_OUTPUT_DIR,
    sheet.outputPath
  );
  return path.join(sourceSheetRoot, relativeOutputPath);
}

function resolveAssetOutputPath(outputRoot, asset) {
  const relativeOutputPath = path.relative(
    LITTLE_ALEX_SPRITE_OUTPUT_DIR,
    asset.outputPath
  );
  return path.join(outputRoot, relativeOutputPath);
}

function updateSpriteRecord(sheetRecord, slug, updates) {
  const record = sheetRecord.sprites.find((sprite) => sprite.slug === slug);
  if (record) {
    Object.assign(record, updates);
  }
}

function resolveQwenProvider() {
  const config = {
    apiKey: requiredEnv("QWEN_IMAGE_API_KEY"),
    baseUrl: requiredEnv("QWEN_IMAGE_BASE_URL"),
    model: requiredEnv("QWEN_IMAGE_MODEL")
  };

  if (config.model !== LITTLE_ALEX_SPRITE_QWEN_MODEL || !isApprovedQwenImageModel(config.model)) {
    throw new Error(
      `Refusing to generate Little Alex sprites with unapproved Qwen model ${config.model}. Approved: ${LITTLE_ALEX_SPRITE_QWEN_MODEL}.`
    );
  }

  return config;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`Missing ${name}. Refusing to generate Little Alex sprites.`);
  }
  return value;
}

async function generateWithQwen({ negativePrompt, options, prompt, provider, size }) {
  const maxAttempts = 4;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await requestQwenImage({ negativePrompt, prompt, provider, size });
    } catch (error) {
      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }
      const waitMs = Math.max(options.delayMs, 15000) * attempt;
      console.warn(
        `Qwen request was rate-limited; retrying in ${Math.round(waitMs / 1000)}s (${attempt}/${maxAttempts - 1}).`
      );
      await sleep(waitMs);
    }
  }
  throw new Error("Qwen Little Alex sprite sheet generation failed after retries.");
}

async function requestQwenImage({ negativePrompt, prompt, provider, size }) {
  const response = await fetch(
    `${trimSlash(provider.baseUrl)}/services/aigc/multimodal-generation/generation`,
    {
      body: JSON.stringify({
        model: provider.model,
        input: {
          messages: [
            {
              role: "user",
              content: [{ text: prompt }]
            }
          ]
        },
        parameters: {
          negative_prompt: negativePrompt,
          prompt_extend: false,
          watermark: false,
          size,
          n: 1
        }
      }),
      headers: jsonHeaders(provider.apiKey),
      method: "POST"
    }
  );
  const body = await readJson(
    response,
    "Qwen Little Alex sprite sheet generation request failed"
  );
  const imageUrl = extractQwenImageUrl(body);
  if (!imageUrl) {
    throw new Error("Qwen Little Alex sprite sheet generation response did not include an image URL.");
  }

  const imageResponse = await fetch(requireHttpsUrl(imageUrl));
  if (!imageResponse.ok) {
    throw new Error(`Generated Little Alex sprite sheet download failed with status ${imageResponse.status}.`);
  }
  const contentType = imageResponse.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/png")) {
    throw new Error(
      `Generated Little Alex sprite sheet was ${contentType || "unknown type"}, not image/png.`
    );
  }
  return new Uint8Array(await imageResponse.arrayBuffer());
}

async function validateSheetFile(filePath, sheet) {
  return validateSheetImage(await readFileBytes(filePath), sheet);
}

async function validateSheetImage(bytes, sheet) {
  if (bytes.byteLength > 12 * 1024 * 1024) {
    throw new Error(`Generated Little Alex source sheet ${sheet.slug} exceeded the maximum size.`);
  }
  const metadata = await sharp(bytes).metadata();
  const [expectedWidth, expectedHeight] = sheet.size.split("*").map(Number);
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight) {
    throw new Error(
      `Generated Little Alex source sheet ${sheet.slug} must be ${expectedWidth}x${expectedHeight}, received ${metadata.width}x${metadata.height}.`
    );
  }

  return {
    format: metadata.format,
    height: metadata.height,
    width: metadata.width
  };
}

async function cropTransparentSprite(sourceSheetPath, asset) {
  const { data, info } = await sharp(sourceSheetPath)
    .extract({
      height: asset.crop.height,
      left: asset.crop.x,
      top: asset.crop.y,
      width: asset.crop.width
    })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const qa = keyChromaBackground(data, info, asset);
  const png = await sharp(data, {
    raw: {
      channels: 4,
      height: info.height,
      width: info.width
    }
  })
    .png()
    .toBuffer();

  return { png, qa };
}

function keyChromaBackground(data, info, asset) {
  const background = findEdgeConnectedBackground(data, info);
  let backgroundPixels = 0;
  let opaquePixels = 0;
  let transparentPixels = 0;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const alpha = data[index + 3];
    const greenDominance = green - Math.max(red, blue);
    const pixelIndex = index / 4;

    if (background[pixelIndex]) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
      backgroundPixels += 1;
      transparentPixels += 1;
      continue;
    }

    if (alpha >= 220) {
      opaquePixels += 1;
    }
    if (alpha === 0) {
      transparentPixels += 1;
    } else if (greenDominance > 14 && green > 80) {
      const cap = Math.max(red, blue);
      data[index + 1] = Math.min(green, cap);
    }
  }

  if (backgroundPixels === 0) {
    throw new Error(
      `Cropped Little Alex sprite ${asset.slug} did not contain removable background pixels.`
    );
  }
  if (opaquePixels < 300) {
    throw new Error(
      `Cropped Little Alex sprite ${asset.slug} has too few opaque sprite pixels (${opaquePixels}).`
    );
  }

  return {
    alpha: "present",
    backgroundPixels,
    height: info.height,
    opaquePixels,
    transparentPixels,
    width: info.width
  };
}

function findEdgeConnectedBackground(data, info) {
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const queue = [];
  const pushIfBackground = (x, y) => {
    if (x < 0 || x >= info.width || y < 0 || y >= info.height) {
      return;
    }
    const pixelIndex = y * info.width + x;
    if (visited[pixelIndex] || !isBackgroundLike(data, pixelIndex * 4)) {
      return;
    }
    visited[pixelIndex] = 1;
    queue.push(pixelIndex);
  };

  for (let x = 0; x < info.width; x += 1) {
    pushIfBackground(x, 0);
    pushIfBackground(x, info.height - 1);
  }
  for (let y = 1; y < info.height - 1; y += 1) {
    pushIfBackground(0, y);
    pushIfBackground(info.width - 1, y);
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixelIndex = queue[cursor];
    const x = pixelIndex % info.width;
    const y = Math.floor(pixelIndex / info.width);

    pushIfBackground(x + 1, y);
    pushIfBackground(x - 1, y);
    pushIfBackground(x, y + 1);
    pushIfBackground(x, y - 1);
  }

  return visited;
}

function isBackgroundLike(data, offset) {
  const red = data[offset];
  const green = data[offset + 1];
  const blue = data[offset + 2];
  const alpha = data[offset + 3];
  if (alpha === 0) {
    return true;
  }

  const greenDominance = green - Math.max(red, blue);
  const distanceFromPureKey = Math.max(
    Math.abs(red),
    Math.abs(green - 255),
    Math.abs(blue)
  );
  const isKeyLike =
    alpha > 0 &&
    green >= 135 &&
    red <= 190 &&
    blue <= 190 &&
    (greenDominance >= 34 || distanceFromPureKey <= 82);
  const channelSpread = Math.max(red, green, blue) - Math.min(red, green, blue);
  const isLightPaper =
    alpha > 0 && red >= 168 && green >= 168 && blue >= 158 && channelSpread <= 82;

  return isKeyLike || isLightPaper;
}

async function readFileBytes(filePath) {
  return new Uint8Array(readFileSync(filePath));
}

async function readJson(response, errorMessage) {
  if (!response.ok) {
    throw new ProviderHttpError(`${errorMessage} with status ${response.status}.`, {
      status: response.status
    });
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${errorMessage}: response was not valid JSON.`);
  }
}

function extractQwenImageUrl(body) {
  const content = body.output?.choices?.[0]?.message?.content;
  if (!Array.isArray(content)) {
    return null;
  }
  for (const item of content) {
    if (item?.image && typeof item.image === "string") {
      return item.image;
    }
    if (item?.url && typeof item.url === "string") {
      return item.url;
    }
    if (item?.image_url && typeof item.image_url === "string") {
      return item.image_url;
    }
  }
  return null;
}

function isRetryableError(error) {
  return error instanceof ProviderHttpError && [408, 429, 500, 502, 503, 504].includes(error.status);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function requireHttpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("Generated Little Alex sprite sheet URL must use https.");
  }
  return url.toString();
}

function trimSlash(value) {
  return value.replace(/\/+$/, "");
}

function repoRelative(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function jsonHeaders(apiKey) {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
  };
}

function resolveUserPath(value) {
  return path.isAbsolute(value) ? value : path.resolve(repoRoot, value);
}

function loadLocalEnv(filePath) {
  if (!existsSync(filePath)) {
    return;
  }
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }
    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }
    const key = line.slice(0, equalsIndex).trim();
    const value = unquote(line.slice(equalsIndex + 1).trim());
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function unquote(value) {
  if (
    (value.startsWith("\"") && value.endsWith("\"")) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
