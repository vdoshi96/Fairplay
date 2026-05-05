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
  const missingNames = Object.values(envMapping).filter(
    (name) => !unsafeValueLooksPresent(env[name])
  );

  if (missingNames.length > 0) {
    throw new QwenConfigError(missingNames);
  }

  const imageModel = env.QWEN_IMAGE_MODEL as string;
  if (!isApprovedQwenImageModel(imageModel)) {
    throw new QwenImageModelConfigError();
  }

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
