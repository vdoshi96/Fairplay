#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const [
  { FAIRPLAY_SOURCE_CARDS },
  {
    APPROVED_OPENAI_IMAGE_MODELS,
    APPROVED_QWEN_IMAGE_MODELS,
    approvedImageModelSummary,
    isApprovedOpenAiImageModel,
    isApprovedQwenImageModel
  },
  { buildSourceCardCoverPrompt, sourceCardCoverNegativePrompt }
] = await Promise.all([
  importTs("src/seed/fairplay-source-cards.ts"),
  importTs("src/server/ai/approved-image-models.ts"),
  importTs("src/server/ai/visible-asset-prompts.ts")
]);

loadLocalEnv(".env.local");

const options = parseArgs(process.argv.slice(2));
const selectedCards = selectCards(FAIRPLAY_SOURCE_CARDS, options);
const outputDir = options.writePublic
  ? path.join(repoRoot, "public/assets/fairplay/cards")
  : path.resolve(repoRoot, options.outputDir);
const manifest = {
  generatedAt: new Date().toISOString(),
  mode: options.dryRun ? "dry-run" : "generate",
  approvedModels: {
    qwen: APPROVED_QWEN_IMAGE_MODELS,
    openaiFallback: APPROVED_OPENAI_IMAGE_MODELS
  },
  outputDir,
  cards: []
};

await mkdir(outputDir, { recursive: true });

const provider = options.dryRun ? null : resolveProvider(options.provider);
if (provider) {
  console.log(
    `Generating ${selectedCards.length} source card cover(s) with approved ${provider.name} image model.`
  );
}

for (const card of selectedCards) {
  const prompt = buildSourceCardCoverPrompt(card);
  const negativePrompt = sourceCardCoverNegativePrompt;
  const outputPath = path.join(outputDir, `${card.slug}.png`);
  manifest.cards.push({
    slug: card.slug,
    prompt,
    negativePrompt,
    outputPath
  });

  if (options.dryRun) {
    continue;
  }

  const imageBytes = await generatePng({
    negativePrompt,
    prompt,
    provider
  });
  await writeFile(outputPath, imageBytes);
  console.log(`Wrote ${path.relative(repoRoot, outputPath)}`);
}

const manifestPath = path.join(outputDir, "generation-manifest.json");
await writeFile(`${manifestPath}`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${path.relative(repoRoot, manifestPath)}`);

function importTs(relativePath) {
  return import(pathToFileURL(path.join(repoRoot, relativePath)).href);
}

function parseArgs(args) {
  const options = {
    dryRun: false,
    limit: null,
    outputDir: "artifacts/generated-visible-assets/cards",
    provider: "qwen",
    qwenSize: "1460*2044",
    slugs: null,
    writePublic: false
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--write-public") {
      options.writePublic = true;
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
    } else if (arg === "--provider") {
      options.provider = args[++index];
    } else if (arg.startsWith("--provider=")) {
      options.provider = arg.slice("--provider=".length);
    } else if (arg === "--qwen-size") {
      options.qwenSize = args[++index];
    } else if (arg.startsWith("--qwen-size=")) {
      options.qwenSize = arg.slice("--qwen-size=".length);
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!["qwen", "openai"].includes(options.provider)) {
    throw new Error("--provider must be qwen or openai.");
  }
  if (options.limit !== null && (!Number.isInteger(options.limit) || options.limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }

  return options;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function selectCards(cards, options) {
  let selected = [...cards];
  if (options.slugs?.length) {
    const wanted = new Set(options.slugs);
    selected = selected.filter((card) => wanted.has(card.slug));
    const found = new Set(selected.map((card) => card.slug));
    const missing = options.slugs.filter((slug) => !found.has(slug));
    if (missing.length > 0) {
      throw new Error(`Unknown source card slug(s): ${missing.join(", ")}`);
    }
  }
  if (options.limit !== null) {
    selected = selected.slice(0, options.limit);
  }
  return selected;
}

function resolveProvider(providerName) {
  if (providerName === "qwen") {
    const config = {
      apiKey: requiredEnv("QWEN_IMAGE_API_KEY"),
      baseUrl: requiredEnv("QWEN_IMAGE_BASE_URL"),
      model: requiredEnv("QWEN_IMAGE_MODEL"),
      name: "qwen",
      size: options.qwenSize
    };
    if (!isApprovedQwenImageModel(config.model)) {
      throw new Error(
        `Refusing to generate with unapproved Qwen image model from QWEN_IMAGE_MODEL. Approved: ${approvedImageModelSummary()}.`
      );
    }
    return config;
  }

  const config = {
    apiKey: requiredEnv("OPENAI_IMAGE_API_KEY"),
    baseUrl: requiredEnv("OPENAI_BASE_URL"),
    model: requiredEnv("OPENAI_IMAGE_MODEL"),
    name: "openai",
    quality: "high",
    size: "1024x1536"
  };
  if (!isApprovedOpenAiImageModel(config.model)) {
    throw new Error(
      `Refusing to generate with unapproved OpenAI image model from OPENAI_IMAGE_MODEL. Approved: ${approvedImageModelSummary()}.`
    );
  }
  throw new Error(
    "OpenAI image fallback is approved only as gpt-image-1-mini, but this source-card generator requires exact 5:7 PNG output. Use Qwen for card-cover generation until an OpenAI post-processing step is added."
  );
}

function requiredEnv(name) {
  const value = process.env[name]?.trim() ?? "";
  if (!value) {
    throw new Error(
      `Missing ${name}. Refusing to generate assets until Vercel/local env exposes an approved configured model.`
    );
  }
  return value;
}

async function generatePng({ negativePrompt, prompt, provider }) {
  const imageUrlOrBytes =
    provider.name === "qwen"
      ? await generateWithQwen({ negativePrompt, prompt, provider })
      : await generateWithOpenAi({ negativePrompt, prompt, provider });

  if (imageUrlOrBytes instanceof Uint8Array) {
    validatePngImage(imageUrlOrBytes, provider.name);
    return imageUrlOrBytes;
  }

  const response = await fetch(imageUrlOrBytes);
  if (!response.ok) {
    throw new Error(`Generated image download failed with status ${response.status}.`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/png")) {
    throw new Error(`Generated image was ${contentType || "unknown type"}, not image/png.`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  validatePngImage(bytes, provider.name);
  return bytes;
}

async function generateWithQwen({ negativePrompt, prompt, provider }) {
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
          size: provider.size,
          n: 1
        }
      }),
      headers: jsonHeaders(provider.apiKey),
      method: "POST"
    }
  );
  const body = await readJson(response, "Qwen image generation request failed");
  const imageUrl = extractQwenImageUrl(body);
  if (!imageUrl) {
    throw new Error("Qwen image generation response did not include an image URL.");
  }
  return requireHttpsUrl(imageUrl);
}

async function generateWithOpenAi({ negativePrompt, prompt, provider }) {
  const response = await fetch(`${trimSlash(provider.baseUrl)}/images/generations`, {
    body: JSON.stringify({
      model: provider.model,
      prompt: `${prompt}\n\nNegative prompt: ${negativePrompt}`,
      size: provider.size,
      quality: provider.quality,
      output_format: "png",
      n: 1
    }),
    headers: jsonHeaders(provider.apiKey),
    method: "POST"
  });
  const body = await readJson(response, "OpenAI image generation request failed");
  const image = body.data?.[0];
  if (typeof image?.b64_json === "string" && image.b64_json.trim()) {
    return new Uint8Array(Buffer.from(image.b64_json, "base64"));
  }
  if (typeof image?.url === "string" && image.url.trim()) {
    return requireHttpsUrl(image.url);
  }
  throw new Error("OpenAI image generation response did not include image bytes or a URL.");
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
    throw new Error(`${errorMessage} with status ${response.status}.`);
  }
  try {
    return await response.json();
  } catch {
    throw new Error(`${errorMessage}: response was not valid JSON.`);
  }
}

function requireHttpsUrl(value) {
  const url = new URL(value);
  if (url.protocol !== "https:") {
    throw new Error("Generated image URL must use https.");
  }
  return url.toString();
}

function trimSlash(value) {
  return value.replace(/\/+$/, "");
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

function validatePngImage(bytes, providerName) {
  if (bytes.byteLength > 8 * 1024 * 1024) {
    throw new Error(`Generated ${providerName} image exceeded the maximum asset size.`);
  }
  const size = pngDimensions(bytes);
  if (!size) {
    throw new Error(`Generated ${providerName} image bytes were not a valid PNG.`);
  }
  if (size.width * 7 !== size.height * 5) {
    throw new Error(
      `Generated ${providerName} image must be 5:7, received ${size.width}x${size.height}.`
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
