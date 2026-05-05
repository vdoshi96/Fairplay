#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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
    GENERATED_UI_ASSETS,
    GENERATED_UI_ASSET_OUTPUT_DIR,
    GENERATED_UI_QWEN_MODEL,
    buildGeneratedUiAssetPrompt,
    generatedUiAssetNegativePrompt
  },
  { isApprovedQwenImageModel }
] = await Promise.all([
  importTs("src/server/ai/generated-ui-assets.ts"),
  importTs("src/server/ai/approved-image-models.ts")
]);

loadLocalEnv(".env.local");

const options = parseArgs(process.argv.slice(2));
const selectedAssets = selectAssets(GENERATED_UI_ASSETS, options);
const outputRoot = path.resolve(repoRoot, options.outputDir);
const manifest = {
  generatedAt: new Date().toISOString(),
  mode: options.dryRun ? "dry-run" : "generate",
  approvedModel: GENERATED_UI_QWEN_MODEL,
  outputDir: repoRelative(outputRoot),
  assets: []
};

await mkdir(outputRoot, { recursive: true });

const needsProvider =
  !options.dryRun &&
  (!options.skipExisting ||
    selectedAssets.some((asset) => !existsSync(resolveAssetOutputPath(outputRoot, asset))));
const provider = needsProvider ? resolveQwenProvider() : null;
if (provider) {
  console.log(
    `Generating ${selectedAssets.length} generated UI asset(s) with ${provider.model}.`
  );
} else if (!options.dryRun) {
  console.log("All selected generated UI assets already exist; skipping provider setup.");
}

for (const asset of selectedAssets) {
  const prompt = buildGeneratedUiAssetPrompt(asset);
  const outputPath = resolveAssetOutputPath(outputRoot, asset);
  const alreadyExists = existsSync(outputPath);

  manifest.assets.push({
    alt: asset.alt,
    prompt,
    negativePrompt: generatedUiAssetNegativePrompt,
    outputPath: repoRelative(outputPath),
    size: asset.size,
    skipped: options.skipExisting && alreadyExists,
    slug: asset.slug
  });

  if (options.dryRun) {
    continue;
  }

  await mkdir(path.dirname(outputPath), { recursive: true });
  if (options.skipExisting && alreadyExists) {
    console.log(`Skipped existing ${path.relative(repoRoot, outputPath)}`);
    continue;
  }

  const imageBytes = await generateWithQwen({
    negativePrompt: generatedUiAssetNegativePrompt,
    options,
    prompt,
    provider,
    size: asset.size
  });
  validatePngImage(imageBytes, asset);
  await writeFile(outputPath, imageBytes);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);

  if (options.delayMs > 0) {
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
    dryRun: false,
    delayMs: 12000,
    limit: null,
    outputDir: GENERATED_UI_ASSET_OUTPUT_DIR,
    skipExisting: false,
    slugs: null
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--skip-existing") {
      options.skipExisting = true;
    } else if (arg === "--delay-ms") {
      options.delayMs = Number(args[++index]);
    } else if (arg.startsWith("--delay-ms=")) {
      options.delayMs = Number(arg.slice("--delay-ms=".length));
    } else if (arg === "--limit") {
      options.limit = Number(args[++index]);
    } else if (arg.startsWith("--limit=")) {
      options.limit = Number(arg.slice("--limit=".length));
    } else if (arg === "--slugs") {
      options.slugs = splitList(args[++index]);
    } else if (arg.startsWith("--slugs=")) {
      options.slugs = splitList(arg.slice("--slugs=".length));
    } else if (arg === "--output-dir") {
      options.outputDir = args[++index];
    } else if (arg.startsWith("--output-dir=")) {
      options.outputDir = arg.slice("--output-dir=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive integer.");
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

function selectAssets(assets, options) {
  let selected = [...assets];
  if (options.slugs?.length) {
    const wanted = new Set(options.slugs);
    selected = selected.filter((asset) => wanted.has(asset.slug));
    const found = new Set(selected.map((asset) => asset.slug));
    const missing = options.slugs.filter((slug) => !found.has(slug));
    if (missing.length > 0) {
      throw new Error(`Unknown generated UI asset slug(s): ${missing.join(", ")}`);
    }
  }
  if (options.limit !== null) {
    selected = selected.slice(0, options.limit);
  }
  return selected;
}

function resolveAssetOutputPath(outputRoot, asset) {
  const relativeOutputPath = path.relative(
    GENERATED_UI_ASSET_OUTPUT_DIR,
    asset.outputPath
  );
  return path.join(outputRoot, relativeOutputPath);
}

function resolveQwenProvider() {
  const config = {
    apiKey: requiredEnv("QWEN_IMAGE_API_KEY"),
    baseUrl: requiredEnv("QWEN_IMAGE_BASE_URL"),
    model: requiredEnv("QWEN_IMAGE_MODEL")
  };

  if (config.model !== GENERATED_UI_QWEN_MODEL || !isApprovedQwenImageModel(config.model)) {
    throw new Error(
      `Refusing to generate UI assets with unapproved Qwen model ${config.model}. Approved: ${GENERATED_UI_QWEN_MODEL}.`
    );
  }

  return config;
}

function requiredEnv(name) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(`Missing ${name}. Refusing to generate UI assets.`);
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
  throw new Error("Qwen UI image generation failed after retries.");
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
  const body = await readJson(response, "Qwen UI image generation request failed");
  const imageUrl = extractQwenImageUrl(body);
  if (!imageUrl) {
    throw new Error("Qwen UI image generation response did not include an image URL.");
  }

  const imageResponse = await fetch(requireHttpsUrl(imageUrl));
  if (!imageResponse.ok) {
    throw new Error(`Generated UI image download failed with status ${imageResponse.status}.`);
  }
  const contentType = imageResponse.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/png")) {
    throw new Error(`Generated UI image was ${contentType || "unknown type"}, not image/png.`);
  }
  return new Uint8Array(await imageResponse.arrayBuffer());
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
    throw new Error("Generated UI image URL must use https.");
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

function loadLocalEnv(filename) {
  const filePath = path.join(repoRoot, filename);
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

function validatePngImage(bytes, asset) {
  if (bytes.byteLength > 8 * 1024 * 1024) {
    throw new Error(`Generated UI asset ${asset.slug} exceeded the maximum size.`);
  }
  const actualSize = pngDimensions(bytes);
  if (!actualSize) {
    throw new Error(`Generated UI asset ${asset.slug} was not a valid PNG.`);
  }
  const [expectedWidth, expectedHeight] = asset.size.split("*").map(Number);
  if (actualSize.width !== expectedWidth || actualSize.height !== expectedHeight) {
    throw new Error(
      `Generated UI asset ${asset.slug} must be ${expectedWidth}x${expectedHeight}, received ${actualSize.width}x${actualSize.height}.`
    );
  }
}

function pngDimensions(bytes) {
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
    width: readUint32(bytes, 16),
    height: readUint32(bytes, 20)
  };
}

function readUint32(bytes, offset) {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}
