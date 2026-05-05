import "server-only";

import { z } from "zod";

import { AreaKeySchema } from "@/contracts/responsibilities";
import { CadenceSchema, HiddenEffortKeySchema } from "@/domain/enums";
import { getQwenConfig, type QwenConfig } from "./qwen-config";

export type StructuredAiCard = {
  title: string;
  summary: string;
  areaKeys: string[];
  hiddenEffortKeys: Array<
    | "noticing"
    | "planning"
    | "doing"
    | "follow_through"
    | "emotional_attention"
  >;
  cadence:
    | "daily"
    | "weekly"
    | "monthly"
    | "seasonal"
    | "event_based"
    | "as_needed"
    | "one_time";
  definition: string;
  conception: string;
  planning: string;
  execution: string;
  minimumStandard: string;
  imagePrompt: string;
  imageNegativePrompt: string;
};

export type GeneratedCoverImage = {
  bytes: Uint8Array;
  mimeType: string;
};

export type QwenGeneratorDeps = {
  fetch?: typeof fetch;
  config?: QwenConfig;
};

const MAX_IMAGE_PROMPT_CHARS = 800;
const MAX_IMAGE_NEGATIVE_PROMPT_CHARS = 500;
const MAX_GENERATED_IMAGE_BYTES = 5 * 1024 * 1024;

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

const StructuredAiCardSchema = z
  .object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    areaKeys: z.array(AreaKeySchema).min(1),
    hiddenEffortKeys: z.array(HiddenEffortKeySchema).min(1),
    cadence: CadenceSchema,
    definition: z.string().trim().min(1),
    conception: z.string().trim().min(1),
    planning: z.string().trim().min(1),
    execution: z.string().trim().min(1),
    minimumStandard: z.string().trim().min(1),
    imagePrompt: z.string().trim().min(1),
    imageNegativePrompt: z.string().trim().min(1)
  })
  .strict() satisfies z.ZodType<StructuredAiCard>;

const cardSystemPrompt = [
  "You structure household responsibility tasks into original Fairplay card JSON.",
  "Return only strict JSON with title, summary, areaKeys, hiddenEffortKeys, cadence, definition, conception, planning, execution, minimumStandard, imagePrompt, and imageNegativePrompt.",
  "Keep the tone practical, non-clinical, non-blaming, and safe for collaborative household planning.",
  "Do not diagnose relationships, score partners, assign blame, or write therapy-style advice.",
  "Create original wording and source-style/IP guardrails: do not copy public decks, proprietary card language, workbook text, labels, logos, layouts, or distinctive source material.",
  "Image prompts must describe an original warm household-object card cover and avoid people, stereotypes, brand marks, watermarks, or readable proprietary labels."
].join("\n");

const imageStylePrompt = [
  "Create an original 5:7 portrait Fairplay household card cover.",
  "Use a warm pale background, simple household-object line drawing, strong black outline, restrained orange/yellow accents, and title text near the top.",
  "Do not copy public source decks, workbook/Trello/card layouts, proprietary labels, logos, watermarks, people, partner blame, or gendered chore stereotypes."
].join(" ");

const imageNegativePrompt = [
  "copied public source deck style",
  "workbook layout",
  "Trello layout",
  "readable proprietary labels",
  "logos",
  "watermarks",
  "people",
  "partner blame",
  "gendered chore stereotypes"
].join(", ");

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
  const userPrompt = [
    `Task text: ${input.taskText}`,
    input.existingDraft
      ? `Existing draft fields to preserve when useful: ${JSON.stringify(input.existingDraft)}`
      : null
  ]
    .filter(Boolean)
    .join("\n\n");

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

  if (!content.trim()) {
    throw new QwenGenerationError(
      "Qwen card structuring response did not include JSON content."
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new QwenGenerationError("Qwen card structuring response was not valid JSON.");
  }

  const result = StructuredAiCardSchema.safeParse(parsed);
  if (!result.success) {
    throw new QwenGenerationError("Qwen card structuring response had invalid fields.");
  }

  return result.data;
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

  const safeImageUrl = parseDownloadableImageUrl(imageUrl);
  const imageResponse = await fetchImpl(safeImageUrl);
  if (!imageResponse.ok) {
    throw new QwenGenerationError(
      `Qwen generated image download failed with status ${imageResponse.status}.`
    );
  }

  const mimeType = imageResponse.headers.get("content-type") ?? "image/png";
  if (!isImageMimeType(mimeType)) {
    throw new QwenGenerationError("Qwen generated image download was not an image.");
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

function buildImagePrompt(title: string, generatedPrompt: string) {
  return capText(
    [
      imageStylePrompt,
      `Title: ${title.trim()}`,
      generatedPrompt.trim()
    ].join("\n"),
    MAX_IMAGE_PROMPT_CHARS
  );
}

function buildImageNegativePrompt(generatedNegativePrompt: string) {
  return capText(
    [imageNegativePrompt, generatedNegativePrompt.trim()]
      .filter((part) => part.length > 0)
      .join(", "),
    MAX_IMAGE_NEGATIVE_PROMPT_CHARS
  );
}

function capText(value: string, maxChars: number) {
  return value.length <= maxChars ? value : value.slice(0, maxChars);
}

function parseDownloadableImageUrl(value: string) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new QwenGenerationError("Qwen image generation response included an invalid image URL.");
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new QwenGenerationError(
      "Qwen image generation response included an unsupported image URL scheme."
    );
  }

  return parsed.toString();
}

function isImageMimeType(value: string) {
  return value.toLowerCase().split(";")[0].trim().startsWith("image/");
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
