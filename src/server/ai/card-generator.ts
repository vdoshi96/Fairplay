import "server-only";

import {
  generateCardCover as generateCardCoverWithQwen,
  structureTaskAsCard as structureTaskAsCardWithQwen,
  transcribeAudio as transcribeAudioWithQwen,
  type GeneratedCoverImage,
  type StructuredAiCard
} from "./qwen-card-generator";
import { getOpenAiFallbackConfig } from "./openai-config";
import { isFiveBySevenPng } from "./card-generation-shared";
import {
  generateCardCoverWithOpenAi,
  structureTaskAsCardWithOpenAi,
  transcribeAudioWithOpenAi
} from "./openai-card-generator";

export type { GeneratedCoverImage, StructuredAiCard };

export async function transcribeAudio(input: {
  bytes: Uint8Array;
  mimeType: string;
  contextText?: string;
}): Promise<string> {
  try {
    return await transcribeAudioWithQwen(input);
  } catch (primaryError) {
    const fallbackConfig = getOpenAiFallbackConfig();
    if (!fallbackConfig.enabled) {
      throw primaryError;
    }

    return transcribeAudioWithOpenAi(input, { config: fallbackConfig });
  }
}

export async function structureTaskAsCard(
  input: { taskText: string; existingDraft?: Partial<StructuredAiCard> }
): Promise<StructuredAiCard> {
  try {
    return await structureTaskAsCardWithQwen(input);
  } catch (primaryError) {
    const fallbackConfig = getOpenAiFallbackConfig();
    if (!fallbackConfig.enabled) {
      throw primaryError;
    }

    return structureTaskAsCardWithOpenAi(input, { config: fallbackConfig });
  }
}

export async function generateCardCover(input: {
  title: string;
  imagePrompt: string;
  negativePrompt: string;
}): Promise<GeneratedCoverImage> {
  try {
    return await generateCardCoverWithQwen(input);
  } catch (primaryError) {
    const fallbackConfig = getOpenAiFallbackConfig();
    if (!fallbackConfig.enabled) {
      throw primaryError;
    }

    const cover = await generateCardCoverWithOpenAi(input, { config: fallbackConfig });
    if (cover.mimeType !== "image/png" || !isFiveBySevenPng(cover.bytes)) {
      throw primaryError;
    }

    return cover;
  }
}
