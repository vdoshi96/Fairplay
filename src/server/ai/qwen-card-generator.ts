import "server-only";

import {
  buildCardStructuringUserPrompt,
  buildImageNegativePrompt,
  buildImagePrompt,
  cardSystemPrompt,
  MAX_GENERATED_IMAGE_BYTES,
  parseDownloadableImageUrl,
  parseStructuredCardJson,
  safeRasterImageMimeType,
  type GeneratedCoverImage,
  type StructuredAiCard
} from "./card-generation-shared";
import { getQwenConfig, type QwenConfig } from "./qwen-config";

export type { GeneratedCoverImage, StructuredAiCard } from "./card-generation-shared";

export type QwenGeneratorDeps = {
  fetch?: typeof fetch;
  config?: QwenConfig;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type ImageGenerationResponse = {
  output?: {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };
};

export class QwenGenerationError extends Error {
  readonly code = "QWEN_GENERATION_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "QwenGenerationError";
  }
}

export async function transcribeAudio(
  input: { bytes: Uint8Array; mimeType: string; contextText?: string },
  deps: QwenGeneratorDeps = {}
): Promise<string> {
  const config = resolveConfig(deps);
  const fetchImpl = resolveFetch(deps);
  const messages: Array<Record<string, unknown>> = [];

  if (input.contextText?.trim()) {
    messages.push({
      role: "system",
      content: [
        {
          type: "text",
          text: `Context for this short household task recording: ${input.contextText.trim()}`
        }
      ]
    });
  }

  messages.push({
    role: "user",
    content: [
      {
        type: "input_audio",
        input_audio: {
          data: toDataUrl(input.bytes, input.mimeType)
        }
      }
    ]
  });

  const response = await fetchImpl(`${trimSlash(config.openAiBaseUrl)}/chat/completions`, {
    method: "POST",
    headers: jsonHeaders(config.cardApiKey),
    body: JSON.stringify({
      model: config.asrModel,
      messages,
      temperature: 0
    })
  });
  const body = await readProviderJson<ChatCompletionResponse>(
    response,
    "Qwen ASR request failed"
  );
  const content = extractTextContent(body);

  if (!content.trim()) {
    throw new QwenGenerationError("Qwen ASR response did not include text content.");
  }

  return content.trim();
}

export async function structureTaskAsCard(
  input: { taskText: string; existingDraft?: Partial<StructuredAiCard> },
  deps: QwenGeneratorDeps = {}
): Promise<StructuredAiCard> {
  const config = resolveConfig(deps);
  const fetchImpl = resolveFetch(deps);
  const userPrompt = buildCardStructuringUserPrompt(input);

  const response = await fetchImpl(`${trimSlash(config.openAiBaseUrl)}/chat/completions`, {
    method: "POST",
    headers: jsonHeaders(config.cardApiKey),
    body: JSON.stringify({
      model: config.cardModel,
      messages: [
        { role: "system", content: cardSystemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });
  const body = await readProviderJson<ChatCompletionResponse>(
    response,
    "Qwen card structuring request failed"
  );
  const content = extractTextContent(body);

  return parseStructuredCardJson(
    content,
    (message) => new QwenGenerationError(message),
    "Qwen"
  );
}

export async function generateCardCover(
  input: { title: string; imagePrompt: string; negativePrompt: string },
  deps: QwenGeneratorDeps = {}
): Promise<GeneratedCoverImage> {
  const config = resolveConfig(deps);
  const fetchImpl = resolveFetch(deps);
  const prompt = buildImagePrompt(input.title, input.imagePrompt);
  const negativePrompt = buildImageNegativePrompt(input.negativePrompt);

  const response = await fetchImpl(
    `${trimSlash(config.imageBaseUrl)}/services/aigc/multimodal-generation/generation`,
    {
      method: "POST",
      headers: jsonHeaders(config.imageApiKey),
      body: JSON.stringify({
        model: config.imageModel,
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
          size: "500*700",
          n: 1
        }
      })
    }
  );
  const body = await readProviderJson<ImageGenerationResponse>(
    response,
    "Qwen image generation request failed"
  );
  const imageUrl = extractImageUrl(body);

  if (!imageUrl) {
    throw new QwenGenerationError("Qwen image generation response did not include an image URL.");
  }

  const safeImageUrl = parseDownloadableImageUrl(
    imageUrl,
    (message) => new QwenGenerationError(message),
    "Qwen"
  );
  const imageResponse = await fetchImpl(safeImageUrl);
  if (!imageResponse.ok) {
    throw new QwenGenerationError(
      `Qwen generated image download failed with status ${imageResponse.status}.`
    );
  }

  const mimeType = safeRasterImageMimeType(
    imageResponse.headers.get("content-type") ?? "image/png"
  );
  if (!mimeType) {
    throw new QwenGenerationError(
      "Qwen generated image download was not a supported raster image."
    );
  }

  const contentLength = imageResponse.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_GENERATED_IMAGE_BYTES) {
    throw new QwenGenerationError("Qwen generated image exceeded the maximum size.");
  }

  const bytes = new Uint8Array(await imageResponse.arrayBuffer());
  if (bytes.byteLength > MAX_GENERATED_IMAGE_BYTES) {
    throw new QwenGenerationError("Qwen generated image exceeded the maximum size.");
  }

  return {
    bytes,
    mimeType
  };
}

function resolveConfig(deps: QwenGeneratorDeps): QwenConfig {
  return deps.config ?? getQwenConfig();
}

function resolveFetch(deps: QwenGeneratorDeps): typeof fetch {
  return deps.fetch ?? fetch;
}

function jsonHeaders(apiKey: string) {
  return {
    authorization: `Bearer ${apiKey}`,
    "content-type": "application/json"
  };
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function toDataUrl(bytes: Uint8Array, mimeType: string) {
  return `data:${mimeType};base64,${Buffer.from(bytes).toString("base64")}`;
}

async function readProviderJson<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    throw new QwenGenerationError(`${errorMessage} with status ${response.status}.`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new QwenGenerationError(`${errorMessage}: response was not valid JSON.`);
  }
}

function extractTextContent(body: ChatCompletionResponse): string {
  const content = body.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content;
  }

  return "";
}

function extractImageUrl(body: ImageGenerationResponse): string | null {
  const content = body.output?.choices?.[0]?.message?.content;

  if (!Array.isArray(content)) {
    return null;
  }

  for (const item of content) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const candidate = item as {
      image?: unknown;
      image_url?: unknown;
      url?: unknown;
    };
    const imageUrl =
      typeof candidate.image === "string"
        ? candidate.image
        : typeof candidate.url === "string"
          ? candidate.url
          : typeof candidate.image_url === "string"
            ? candidate.image_url
            : null;

    if (imageUrl) {
      return imageUrl;
    }
  }

  return null;
}
