import "server-only";

import {
  generateCardCover as generateCardCoverWithQwen,
  structureTaskAsCard as structureTaskAsCardWithQwen,
  transcribeAudio as transcribeAudioWithQwen,
  type GeneratedCoverImage,
  type StructuredAiCard
} from "./qwen-card-generator";
import {
  getOpenAiAsrFallbackConfig,
  getOpenAiImageFallbackConfig,
  getOpenAiTextFallbackConfig,
  type OpenAiAsrFallbackConfig,
  type OpenAiImageFallbackConfig,
  type OpenAiTextFallbackConfig
} from "./openai-config";
import { isFiveBySevenPng } from "./card-generation-shared";
import {
  generateCardCoverWithOpenAi,
  structureTaskAsCardWithOpenAi,
  transcribeAudioWithOpenAi
} from "./openai-card-generator";
import {
  logAiGenerationDiagnostic,
  serializeAiError,
  type AiDiagnosticsContext
} from "./diagnostics";

export type { GeneratedCoverImage, StructuredAiCard };

export async function transcribeAudio(
  input: {
    bytes: Uint8Array;
    mimeType: string;
    contextText?: string;
  },
  diagnostics?: AiDiagnosticsContext
): Promise<string> {
  return withOpenAiFallback({
    diagnostics,
    fallback: (config) => transcribeAudioWithOpenAi(input, { config }),
    getFallbackConfig: getOpenAiAsrFallbackConfig,
    primary: () => transcribeAudioWithQwen(input),
    stage: "transcribing"
  });
}

export async function structureTaskAsCard(
  input: { taskText: string; existingDraft?: Partial<StructuredAiCard> },
  diagnostics?: AiDiagnosticsContext
): Promise<StructuredAiCard> {
  return withOpenAiFallback({
    diagnostics,
    fallback: (config) => structureTaskAsCardWithOpenAi(input, { config }),
    getFallbackConfig: getOpenAiTextFallbackConfig,
    primary: () => structureTaskAsCardWithQwen(input),
    stage: "structuring"
  });
}

export async function generateCardCover(
  input: {
    title: string;
    imagePrompt: string;
    negativePrompt: string;
  },
  diagnostics?: AiDiagnosticsContext
): Promise<GeneratedCoverImage> {
  return withOpenAiFallback({
    diagnostics,
    fallback: async (config) => {
      const cover = await generateCardCoverWithOpenAi(input, { config });
      if (cover.mimeType !== "image/png" || !isFiveBySevenPng(cover.bytes)) {
        throw new InvalidOpenAiImageFallbackError(config.imageModel);
      }

      return cover;
    },
    getFallbackConfig: getOpenAiImageFallbackConfig,
    primary: () => generateCardCoverWithQwen(input),
    stage: "generating_image"
  });
}

class AiProviderFallbackError extends Error {
  readonly code = "AI_PROVIDER_FALLBACK_FAILED";
  readonly model?: string;
  readonly provider?: "openai" | "qwen";
  readonly providerRequestId?: string;
  readonly status?: number;

  constructor(error: unknown) {
    const serialized = serializeAiError(error);
    super("AI provider fallback failed after primary provider failure.");
    this.name = "AiProviderFallbackError";
    this.model = serialized.model;
    this.provider = serialized.provider;
    this.providerRequestId = serialized.providerRequestId;
    this.status = serialized.status;
  }
}

class InvalidOpenAiImageFallbackError extends Error {
  readonly code = "OPENAI_IMAGE_FALLBACK_INVALID";
  readonly model: string;
  readonly provider = "openai";

  constructor(model: string) {
    super("OpenAI image fallback returned a non-5:7 PNG cover.");
    this.name = "InvalidOpenAiImageFallbackError";
    this.model = model;
  }
}

type EnabledOpenAiFallbackConfig =
  | OpenAiAsrFallbackConfig
  | OpenAiImageFallbackConfig
  | OpenAiTextFallbackConfig;

async function withOpenAiFallback<T, TConfig extends EnabledOpenAiFallbackConfig>(input: {
  diagnostics?: AiDiagnosticsContext;
  fallback: (config: TConfig) => Promise<T>;
  getFallbackConfig: () => { enabled: false } | TConfig;
  primary: () => Promise<T>;
  stage: string;
}): Promise<T> {
  try {
    return await input.primary();
  } catch (primaryError) {
    logProviderDiagnostic(input.diagnostics, "provider_failure", primaryError, input.stage);

    let fallbackConfig: { enabled: false } | TConfig;
    try {
      fallbackConfig = input.getFallbackConfig();
    } catch (fallbackConfigError) {
      logProviderDiagnostic(
        input.diagnostics,
        "provider_fallback_failure",
        fallbackConfigError,
        input.stage
      );
      throw new AiProviderFallbackError(fallbackConfigError);
    }

    if (!fallbackConfig.enabled) {
      throw primaryError;
    }

    if (input.diagnostics) {
      logAiGenerationDiagnostic({
        ...input.diagnostics,
        event: "provider_fallback_start",
        provider: "openai",
        stage: input.stage
      });
    }

    try {
      return await input.fallback(fallbackConfig);
    } catch (fallbackError) {
      logProviderDiagnostic(
        input.diagnostics,
        "provider_fallback_failure",
        fallbackError,
        input.stage
      );
      throw new AiProviderFallbackError(fallbackError);
    }
  }
}

function logProviderDiagnostic(
  diagnostics: AiDiagnosticsContext | undefined,
  event: "provider_failure" | "provider_fallback_failure",
  error: unknown,
  stage: string
) {
  if (!diagnostics) {
    return;
  }

  const serialized = serializeAiError(error);
  logAiGenerationDiagnostic({
    ...diagnostics,
    event,
    errorCode: serialized.code,
    errorName: serialized.name,
    model: serialized.model,
    provider: serialized.provider,
    providerRequestId: serialized.providerRequestId,
    stage,
    status: serialized.status
  });
}
