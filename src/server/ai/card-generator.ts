import "server-only";

import {
  generateCardCover as generateCardCoverWithQwen,
  structureTaskAsCard as structureTaskAsCardWithQwen,
  transcribeAudio,
  type GeneratedCoverImage,
  type StructuredAiCard
} from "./qwen-card-generator";
import { getOpenAiFallbackConfig } from "./openai-config";
import {
  generateCardCoverWithOpenAi,
  structureTaskAsCardWithOpenAi
} from "./openai-card-generator";

export { transcribeAudio, type GeneratedCoverImage, type StructuredAiCard };

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

    return generateCardCoverWithOpenAi(input, { config: fallbackConfig });
  }
}
