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
  approvedImageModelSummary,
  isApprovedOpenAiImageModel
} from "./approved-image-models";
import {
  getOpenAiFallbackConfig,
  type OpenAiEnabledFallbackConfig
} from "./openai-config";
import { providerRequestIdFromHeaders } from "./diagnostics";

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

type TranscriptionResponse = {
  text?: unknown;
};

export class OpenAiGenerationError extends Error {
  readonly code = "OPENAI_GENERATION_FAILED";
  readonly provider = "openai";
  readonly model?: string;
  readonly providerRequestId?: string;
  readonly status?: number;

  constructor(
    message: string,
    metadata: {
      model?: string;
      providerRequestId?: string;
      status?: number;
    } = {}
  ) {
    super(message);
    this.name = "OpenAiGenerationError";
    this.model = metadata.model;
    this.providerRequestId = metadata.providerRequestId;
    this.status = metadata.status;
  }
}

export async function transcribeAudioWithOpenAi(
  input: { bytes: Uint8Array; mimeType: string; contextText?: string },
  deps: OpenAiGeneratorDeps = {}
): Promise<string> {
  const config = resolveConfig(deps);
  const fetchImpl = resolveFetch(deps);
  const formData = new FormData();
  formData.append("file", audioBlob(input.bytes, input.mimeType), audioFileName(input.mimeType));
  formData.append("model", config.asrModel);
  formData.append("response_format", "json");

  if (input.contextText?.trim()) {
    formData.append(
      "prompt",
      `Context for this short household task recording: ${input.contextText.trim()}`
    );
  }

  const response = await fetchImpl(`${trimSlash(config.baseUrl)}/audio/transcriptions`, {
    method: "POST",
    headers: authHeaders(config.asrApiKey),
    body: formData
  });
  const body = await readProviderJson<TranscriptionResponse>(
    response,
    "OpenAI ASR request failed",
    config.asrModel
  );

  if (typeof body.text !== "string" || !body.text.trim()) {
    throw new OpenAiGenerationError("OpenAI ASR response did not include text content.");
  }

  return body.text.trim();
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
    "OpenAI card structuring request failed",
    config.textModel
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
    "OpenAI image generation request failed",
    config.imageModel
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
    return downloadGeneratedImage(image.url, fetchImpl, config.imageModel);
  }

  throw new OpenAiGenerationError(
    "OpenAI image generation response did not include image bytes or an image URL."
  );
}

function resolveConfig(deps: OpenAiGeneratorDeps): OpenAiEnabledFallbackConfig {
  const config = deps.config ?? getEnabledOpenAiFallbackConfig();
  assertApprovedConfig(config);
  return config;
}

function getEnabledOpenAiFallbackConfig(): OpenAiEnabledFallbackConfig {
  const config = getOpenAiFallbackConfig();
  if (!config.enabled) {
    throw new OpenAiGenerationError("OpenAI fallback is disabled.");
  }

  return config;
}

function assertApprovedConfig(config: OpenAiEnabledFallbackConfig): void {
  if (!isApprovedOpenAiImageModel(config.imageModel)) {
    throw new OpenAiGenerationError(
      `Unsupported OpenAI image model configured in OPENAI_IMAGE_MODEL. Approved image models: ${approvedImageModelSummary()}.`,
      { model: config.imageModel }
    );
  }
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

function authHeaders(apiKey: string) {
  return {
    authorization: `Bearer ${apiKey}`
  };
}

function trimSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function audioBlob(bytes: Uint8Array, mimeType: string) {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return new Blob([copy], { type: mimeType });
}

function audioFileName(mimeType: string) {
  const normalized = mimeType.toLowerCase().split(";")[0]?.trim();
  switch (normalized) {
    case "audio/mpeg":
    case "audio/mp3":
      return "recording.mp3";
    case "audio/mp4":
      return "recording.mp4";
    case "audio/mpga":
      return "recording.mpga";
    case "audio/m4a":
    case "audio/x-m4a":
      return "recording.m4a";
    case "audio/wav":
    case "audio/x-wav":
      return "recording.wav";
    case "audio/webm":
    default:
      return "recording.webm";
  }
}

async function readProviderJson<T>(
  response: Response,
  errorMessage: string,
  model: string
): Promise<T> {
  if (!response.ok) {
    throw new OpenAiGenerationError(`${errorMessage} with status ${response.status}.`, {
      model,
      providerRequestId: providerRequestIdFromHeaders(response.headers),
      status: response.status
    });
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
  fetchImpl: typeof fetch,
  model: string
): Promise<GeneratedCoverImage> {
  const safeImageUrl = parseDownloadableImageUrl(
    imageUrl,
    (message) => new OpenAiGenerationError(message),
    "OpenAI"
  );
  const imageResponse = await fetchImpl(safeImageUrl);
  if (!imageResponse.ok) {
    throw new OpenAiGenerationError(
      `OpenAI generated image download failed with status ${imageResponse.status}.`,
      {
        model,
        providerRequestId: providerRequestIdFromHeaders(imageResponse.headers),
        status: imageResponse.status
      }
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
