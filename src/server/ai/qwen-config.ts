import "server-only";

import {
  approvedImageModelSummary,
  isApprovedQwenImageModel
} from "./approved-image-models";
import { unsafeValueLooksPresent } from "./diagnostics";

export type QwenConfig = {
  cardApiKey: string;
  cardModel: string;
  asrModel: string;
  openAiBaseUrl: string;
  imageApiKey: string;
  imageModel: string;
  imageBaseUrl: string;
};

export type QwenTextConfig = Pick<
  QwenConfig,
  "cardApiKey" | "cardModel" | "openAiBaseUrl"
>;

export type QwenAsrConfig = Pick<
  QwenConfig,
  "cardApiKey" | "asrModel" | "openAiBaseUrl"
>;

export type QwenImageConfig = Pick<
  QwenConfig,
  "imageApiKey" | "imageModel" | "imageBaseUrl"
>;

export class QwenConfigError extends Error {
  readonly code = "QWEN_CONFIG_MISSING";

  constructor(missingNames: string[]) {
    super(`Missing required Qwen configuration: ${missingNames.join(", ")}`);
    this.name = "QwenConfigError";
  }
}

export class QwenImageModelConfigError extends Error {
  readonly code = "QWEN_IMAGE_MODEL_UNAPPROVED";

  constructor() {
    super(
      `Unsupported Qwen image model configured in QWEN_IMAGE_MODEL. Approved image models: ${approvedImageModelSummary()}.`
    );
    this.name = "QwenImageModelConfigError";
  }
}

const envMapping = {
  cardApiKey: "QWEN_CARD_API_KEY",
  cardModel: "QWEN_CARD_MODEL",
  asrModel: "QWEN_ASR_MODEL",
  openAiBaseUrl: "QWEN_OPENAI_BASE_URL",
  imageApiKey: "QWEN_IMAGE_API_KEY",
  imageModel: "QWEN_IMAGE_MODEL",
  imageBaseUrl: "QWEN_IMAGE_BASE_URL"
} as const satisfies Record<keyof QwenConfig, string>;

export function getQwenConfig(
  env: Record<string, string | undefined> = process.env
): QwenConfig {
  assertQwenEnvPresent(Object.keys(envMapping) as Array<keyof QwenConfig>, env);
  const imageModel = env.QWEN_IMAGE_MODEL as string;
  assertApprovedQwenImageModel(imageModel);

  return {
    cardApiKey: env.QWEN_CARD_API_KEY as string,
    cardModel: env.QWEN_CARD_MODEL as string,
    asrModel: env.QWEN_ASR_MODEL as string,
    openAiBaseUrl: env.QWEN_OPENAI_BASE_URL as string,
    imageApiKey: env.QWEN_IMAGE_API_KEY as string,
    imageModel,
    imageBaseUrl: env.QWEN_IMAGE_BASE_URL as string
  };
}

export function getQwenTextConfig(
  env: Record<string, string | undefined> = process.env
): QwenTextConfig {
  assertQwenEnvPresent(["cardApiKey", "cardModel", "openAiBaseUrl"], env);

  return {
    cardApiKey: env.QWEN_CARD_API_KEY as string,
    cardModel: env.QWEN_CARD_MODEL as string,
    openAiBaseUrl: env.QWEN_OPENAI_BASE_URL as string
  };
}

export function getQwenAsrConfig(
  env: Record<string, string | undefined> = process.env
): QwenAsrConfig {
  assertQwenEnvPresent(["cardApiKey", "asrModel", "openAiBaseUrl"], env);

  return {
    cardApiKey: env.QWEN_CARD_API_KEY as string,
    asrModel: env.QWEN_ASR_MODEL as string,
    openAiBaseUrl: env.QWEN_OPENAI_BASE_URL as string
  };
}

export function getQwenImageConfig(
  env: Record<string, string | undefined> = process.env
): QwenImageConfig {
  assertQwenEnvPresent(["imageApiKey", "imageModel", "imageBaseUrl"], env);
  const imageModel = env.QWEN_IMAGE_MODEL as string;
  assertApprovedQwenImageModel(imageModel);

  return {
    imageApiKey: env.QWEN_IMAGE_API_KEY as string,
    imageModel,
    imageBaseUrl: env.QWEN_IMAGE_BASE_URL as string
  };
}

function assertQwenEnvPresent(
  keys: Array<keyof QwenConfig>,
  env: Record<string, string | undefined>
) {
  const missingNames = keys
    .map((key) => envMapping[key])
    .filter((name) => !unsafeValueLooksPresent(env[name]));

  if (missingNames.length > 0) {
    throw new QwenConfigError(missingNames);
  }
}

function assertApprovedQwenImageModel(imageModel: string) {
  if (!isApprovedQwenImageModel(imageModel)) {
    throw new QwenImageModelConfigError();
  }
}
