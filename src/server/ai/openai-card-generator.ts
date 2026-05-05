import "server-only";

import {
  buildCardStructuringUserPrompt,
  buildImageNegativePrompt,
  buildImagePrompt,
  cardSystemPrompt,
  detectedRasterImageMimeType,
  MAX_GENERATED_IMAGE_BYTES,
  parseDownloadableImageUrl,
  parseStructuredCardJson,
  safeRasterImageMimeType,
  type GeneratedCoverImage,
  type StructuredAiCard
} from "./card-generation-shared";
import {
  getOpenAiFallbackConfig,
  type OpenAiEnabledFallbackConfig
} from "./openai-config";

export type OpenAiGeneratorDeps = {
  fetch?: typeof fetch;
  config?: OpenAiEnabledFallbackConfig;
};

type ResponsesApiResponse = {
  output_text?: unknown;
  output?: Array<{
    content?: Array<{
      text?: unknown;
    }>;
  }>;
};

type ImageGenerationResponse = {
  data?: Array<{
    b64_json?: unknown;
    url?: unknown;
  }>;
  output_format?: unknown;
};

export class OpenAiGenerationError extends Error {
  readonly code = "OPENAI_GENERATION_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "OpenAiGenerationError";
  }
}

export async function structureTaskAsCardWithOpenAi(
  input: { taskText: string; existingDraft?: Partial<StructuredAiCard> },
  deps: OpenAiGeneratorDeps = {}
): Promise<StructuredAiCard> {
  const config = resolveConfig(deps);
  const fetchImpl = resolveFetch(deps);
  const response = await fetchImpl(`${trimSlash(config.baseUrl)}/responses`, {
    method: "POST",
    headers: jsonHeaders(config.textApiKey),
    body: JSON.stringify({
      model: config.textModel,
      instructions: cardSystemPrompt,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildCardStructuringUserPrompt(input)
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "fairplay_ai_card",
          schema: structuredCardJsonSchema,
          strict: true
        }
      }
    })
  });
  const body = await readProviderJson<ResponsesApiResponse>(
    response,
    "OpenAI card structuring request failed"
  );
  const content = extractResponsesText(body);

  return parseStructuredCardJson(
    content,
    (message) => new OpenAiGenerationError(message),
    "OpenAI"
  );
}

export async function generateCardCoverWithOpenAi(
  input: { title: string; imagePrompt: string; negativePrompt: string },
  deps: OpenAiGeneratorDeps = {}
): Promise<GeneratedCoverImage> {
  const config = resolveConfig(deps);
  const fetchImpl = resolveFetch(deps);
  const prompt = [
    buildImagePrompt(input.title, input.imagePrompt),
    `Negative prompt: ${buildImageNegativePrompt(input.negativePrompt)}`
  ].join("\n");

  const response = await fetchImpl(`${trimSlash(config.baseUrl)}/images/generations`, {
    method: "POST",
    headers: jsonHeaders(config.imageApiKey),
    body: JSON.stringify({
      model: config.imageModel,
      prompt,
      size: "1024x1536",
      quality: "low",
      output_format: "png",
      n: 1
    })
  });
  const body = await readProviderJson<ImageGenerationResponse>(
    response,
    "OpenAI image generation request failed"
  );
  const image = body.data?.[0];

  if (typeof image?.b64_json === "string" && image.b64_json.trim()) {
    const bytes = new Uint8Array(Buffer.from(image.b64_json, "base64"));
    if (bytes.byteLength > MAX_GENERATED_IMAGE_BYTES) {
      throw new OpenAiGenerationError("OpenAI generated image exceeded the maximum size.");
    }
    const mimeType = detectedRasterImageMimeType(bytes);
    if (!mimeType) {
      throw new OpenAiGenerationError(
        "OpenAI generated image bytes were not a supported raster image."
      );
    }

    return {
      bytes,
      mimeType
    };
  }

  if (typeof image?.url === "string" && image.url.trim()) {
    return downloadGeneratedImage(image.url, fetchImpl);
  }

  throw new OpenAiGenerationError(
    "OpenAI image generation response did not include image bytes or an image URL."
  );
}

function resolveConfig(deps: OpenAiGeneratorDeps): OpenAiEnabledFallbackConfig {
  if (deps.config) {
    return deps.config;
  }

  const config = getOpenAiFallbackConfig();
  if (!config.enabled) {
    throw new OpenAiGenerationError("OpenAI fallback is disabled.");
  }

  return config;
}

function resolveFetch(deps: OpenAiGeneratorDeps): typeof fetch {
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

async function readProviderJson<T>(response: Response, errorMessage: string): Promise<T> {
  if (!response.ok) {
    throw new OpenAiGenerationError(`${errorMessage} with status ${response.status}.`);
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new OpenAiGenerationError(`${errorMessage}: response was not valid JSON.`);
  }
}

function extractResponsesText(body: ResponsesApiResponse): string {
  if (typeof body.output_text === "string") {
    return body.output_text;
  }

  for (const item of body.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

async function downloadGeneratedImage(
  imageUrl: string,
  fetchImpl: typeof fetch
): Promise<GeneratedCoverImage> {
  const safeImageUrl = parseDownloadableImageUrl(
    imageUrl,
    (message) => new OpenAiGenerationError(message),
    "OpenAI"
  );
  const imageResponse = await fetchImpl(safeImageUrl);
  if (!imageResponse.ok) {
    throw new OpenAiGenerationError(
      `OpenAI generated image download failed with status ${imageResponse.status}.`
    );
  }

  const mimeType = safeRasterImageMimeType(
    imageResponse.headers.get("content-type") ?? "image/png"
  );
  if (!mimeType) {
    throw new OpenAiGenerationError(
      "OpenAI generated image download was not a supported raster image."
    );
  }

  const contentLength = imageResponse.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_GENERATED_IMAGE_BYTES) {
    throw new OpenAiGenerationError("OpenAI generated image exceeded the maximum size.");
  }

  const bytes = new Uint8Array(await imageResponse.arrayBuffer());
  if (bytes.byteLength > MAX_GENERATED_IMAGE_BYTES) {
    throw new OpenAiGenerationError("OpenAI generated image exceeded the maximum size.");
  }

  return {
    bytes,
    mimeType
  };
}

const structuredCardJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "summary",
    "areaKeys",
    "hiddenEffortKeys",
    "cadence",
    "definition",
    "conception",
    "planning",
    "execution",
    "minimumStandard",
    "imagePrompt",
    "imageNegativePrompt"
  ],
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    areaKeys: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        minLength: 1,
        maxLength: 80
      }
    },
    hiddenEffortKeys: {
      type: "array",
      minItems: 1,
      items: {
        type: "string",
        enum: [
          "noticing",
          "planning",
          "doing",
          "follow_through",
          "emotional_attention"
        ]
      }
    },
    cadence: {
      type: "string",
      enum: [
        "daily",
        "weekly",
        "monthly",
        "seasonal",
        "event_based",
        "as_needed",
        "one_time"
      ]
    },
    definition: { type: "string" },
    conception: { type: "string" },
    planning: { type: "string" },
    execution: { type: "string" },
    minimumStandard: { type: "string" },
    imagePrompt: { type: "string" },
    imageNegativePrompt: { type: "string" }
  }
} as const;
