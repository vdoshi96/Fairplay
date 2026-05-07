import "server-only";

import {
  approvedImageModelSummary,
  isApprovedOpenAiImageModel,
  type ApprovedOpenAiImageModel
} from "./approved-image-models";
import { unsafeValueLooksPresent } from "./diagnostics";

export type OpenAiDisabledFallbackConfig = {
  enabled: false;
};

export type OpenAiEnabledFallbackConfig = {
  enabled: true;
  baseUrl: string;
  textApiKey: string;
  textModel: string;
  asrApiKey: string;
  asrModel: string;
  imageApiKey: string;
  imageModel: ApprovedOpenAiImageModel;
};

export type OpenAiTextFallbackConfig = Pick<
  OpenAiEnabledFallbackConfig,
  "enabled" | "baseUrl" | "textApiKey" | "textModel"
>;

export type OpenAiAsrFallbackConfig = Pick<
  OpenAiEnabledFallbackConfig,
  "enabled" | "baseUrl" | "asrApiKey" | "asrModel"
>;

export type OpenAiImageFallbackConfig = Pick<
  OpenAiEnabledFallbackConfig,
  "enabled" | "baseUrl" | "imageApiKey" | "imageModel"
>;

export type OpenAiFallbackConfig =
  | OpenAiDisabledFallbackConfig
  | OpenAiEnabledFallbackConfig;

export class OpenAiFallbackConfigError extends Error {
  readonly code = "OPENAI_FALLBACK_CONFIG_MISSING";

  constructor(missingNames: string[]) {
    super(`Missing required OpenAI fallback configuration: ${missingNames.join(", ")}`);
    this.name = "OpenAiFallbackConfigError";
  }
}

export class OpenAiImageModelConfigError extends Error {
  readonly code = "OPENAI_IMAGE_MODEL_UNAPPROVED";

  constructor() {
    super(
      `Unsupported OpenAI image model configured in OPENAI_IMAGE_MODEL. Approved image models: ${approvedImageModelSummary()}.`
    );
    this.name = "OpenAiImageModelConfigError";
  }
}

const envMapping = {
  baseUrl: "OPENAI_BASE_URL",
  textApiKey: "OPENAI_TEXT_API_KEY",
  textModel: "OPENAI_TEXT_MODEL",
  asrApiKey: "OPENAI_ASR_API_KEY",
  asrModel: "OPENAI_ASR_MODEL",
  imageApiKey: "OPENAI_IMAGE_API_KEY",
  imageModel: "OPENAI_IMAGE_MODEL"
} as const satisfies Record<keyof Omit<OpenAiEnabledFallbackConfig, "enabled">, string>;

export function getOpenAiFallbackConfig(
  env: Record<string, string | undefined> = process.env
): OpenAiFallbackConfig {
  if (env.AI_PROVIDER_FALLBACK_ENABLED !== "true") {
    return { enabled: false };
  }

  assertOpenAiEnvPresent(
    Object.keys(envMapping) as Array<keyof Omit<OpenAiEnabledFallbackConfig, "enabled">>,
    env
  );
  const imageModel = env.OPENAI_IMAGE_MODEL as string;
  assertApprovedOpenAiImageModel(imageModel);

  return {
    enabled: true,
    baseUrl: env.OPENAI_BASE_URL as string,
    textApiKey: env.OPENAI_TEXT_API_KEY as string,
    textModel: env.OPENAI_TEXT_MODEL as string,
    asrApiKey: env.OPENAI_ASR_API_KEY as string,
    asrModel: env.OPENAI_ASR_MODEL as string,
    imageApiKey: env.OPENAI_IMAGE_API_KEY as string,
    imageModel
  };
}

export function getOpenAiTextFallbackConfig(
  env: Record<string, string | undefined> = process.env
): OpenAiDisabledFallbackConfig | OpenAiTextFallbackConfig {
  if (env.AI_PROVIDER_FALLBACK_ENABLED !== "true") {
    return { enabled: false };
  }

  assertOpenAiEnvPresent(["baseUrl", "textApiKey", "textModel"], env);

  return {
    enabled: true,
    baseUrl: env.OPENAI_BASE_URL as string,
    textApiKey: env.OPENAI_TEXT_API_KEY as string,
    textModel: env.OPENAI_TEXT_MODEL as string
  };
}

export function getOpenAiAsrFallbackConfig(
  env: Record<string, string | undefined> = process.env
): OpenAiDisabledFallbackConfig | OpenAiAsrFallbackConfig {
  if (env.AI_PROVIDER_FALLBACK_ENABLED !== "true") {
    return { enabled: false };
  }

  assertOpenAiEnvPresent(["baseUrl", "asrApiKey", "asrModel"], env);

  return {
    enabled: true,
    baseUrl: env.OPENAI_BASE_URL as string,
    asrApiKey: env.OPENAI_ASR_API_KEY as string,
    asrModel: env.OPENAI_ASR_MODEL as string
  };
}

export function getOpenAiImageFallbackConfig(
  env: Record<string, string | undefined> = process.env
): OpenAiDisabledFallbackConfig | OpenAiImageFallbackConfig {
  if (env.AI_PROVIDER_FALLBACK_ENABLED !== "true") {
    return { enabled: false };
  }

  assertOpenAiEnvPresent(["baseUrl", "imageApiKey", "imageModel"], env);
  const imageModel = env.OPENAI_IMAGE_MODEL as string;
  assertApprovedOpenAiImageModel(imageModel);

  return {
    enabled: true,
    baseUrl: env.OPENAI_BASE_URL as string,
    imageApiKey: env.OPENAI_IMAGE_API_KEY as string,
    imageModel
  };
}

function assertOpenAiEnvPresent(
  keys: Array<keyof Omit<OpenAiEnabledFallbackConfig, "enabled">>,
  env: Record<string, string | undefined>
) {
  const missingNames = keys
    .map((key) => envMapping[key])
    .filter((name) => !unsafeValueLooksPresent(env[name]));
  if (missingNames.length > 0) {
    throw new OpenAiFallbackConfigError(missingNames);
  }
}

function assertApprovedOpenAiImageModel(imageModel: string): asserts imageModel is ApprovedOpenAiImageModel {
  if (!isApprovedOpenAiImageModel(imageModel)) {
    throw new OpenAiImageModelConfigError();
  }
}
