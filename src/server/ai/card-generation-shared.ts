import { z } from "zod";

import { AreaKeySchema } from "@/contracts/responsibilities";
import { CadenceSchema, HiddenEffortKeySchema } from "@/domain/enums";

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

export const MAX_IMAGE_PROMPT_CHARS = 800;
export const MAX_IMAGE_NEGATIVE_PROMPT_CHARS = 500;
export const MAX_GENERATED_IMAGE_BYTES = 5 * 1024 * 1024;

export const StructuredAiCardSchema = z
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

export const cardSystemPrompt = [
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

export function buildCardStructuringUserPrompt(input: {
  taskText: string;
  existingDraft?: Partial<StructuredAiCard>;
}) {
  return [
    `Task text: ${input.taskText}`,
    input.existingDraft
      ? `Existing draft fields to preserve when useful: ${JSON.stringify(input.existingDraft)}`
      : null
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function parseStructuredCardJson(
  content: string,
  makeError: (message: string) => Error,
  providerName: string
) {
  if (!content.trim()) {
    throw makeError(`${providerName} card structuring response did not include JSON content.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw makeError(`${providerName} card structuring response was not valid JSON.`);
  }

  const result = StructuredAiCardSchema.safeParse(parsed);
  if (!result.success) {
    throw makeError(`${providerName} card structuring response had invalid fields.`);
  }

  return result.data;
}

export function buildImagePrompt(title: string, generatedPrompt: string) {
  return capText(
    [
      imageStylePrompt,
      `Title: ${title.trim()}`,
      generatedPrompt.trim()
    ].join("\n"),
    MAX_IMAGE_PROMPT_CHARS
  );
}

export function buildImageNegativePrompt(generatedNegativePrompt: string) {
  return capText(
    [imageNegativePrompt, generatedNegativePrompt.trim()]
      .filter((part) => part.length > 0)
      .join(", "),
    MAX_IMAGE_NEGATIVE_PROMPT_CHARS
  );
}

export function capText(value: string, maxChars: number) {
  return value.length <= maxChars ? value : value.slice(0, maxChars);
}

const SAFE_RASTER_IMAGE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
]);

export function safeRasterImageMimeType(value: string) {
  const mimeType = value.toLowerCase().split(";")[0]?.trim() ?? "";

  return SAFE_RASTER_IMAGE_MIME_TYPES.has(mimeType) ? mimeType : null;
}

export function detectedRasterImageMimeType(bytes: Uint8Array) {
  if (
    bytes.byteLength >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }

  if (bytes.byteLength >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    bytes.byteLength >= 12 &&
    ascii(bytes, 0, 4) === "RIFF" &&
    ascii(bytes, 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }

  if (
    bytes.byteLength >= 6 &&
    (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a")
  ) {
    return "image/gif";
  }

  return null;
}

export function parseDownloadableImageUrl(
  value: string,
  makeError: (message: string) => Error,
  providerName: string
) {
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw makeError(`${providerName} image generation response included an invalid image URL.`);
  }

  if (parsed.protocol !== "https:") {
    throw makeError(
      `${providerName} image generation response included an unsupported image URL scheme.`
    );
  }

  return parsed.toString();
}

function ascii(bytes: Uint8Array, start: number, end: number) {
  return String.fromCharCode(...bytes.slice(start, end));
}
