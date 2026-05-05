import "server-only";

export type OpenAiDisabledFallbackConfig = {
  enabled: false;
};

export type OpenAiEnabledFallbackConfig = {
  enabled: true;
  baseUrl: string;
  textApiKey: string;
  textModel: string;
  imageApiKey: string;
  imageModel: string;
};

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

const envMapping = {
  baseUrl: "OPENAI_BASE_URL",
  textApiKey: "OPENAI_TEXT_API_KEY",
  textModel: "OPENAI_TEXT_MODEL",
  imageApiKey: "OPENAI_IMAGE_API_KEY",
  imageModel: "OPENAI_IMAGE_MODEL"
} as const satisfies Record<keyof Omit<OpenAiEnabledFallbackConfig, "enabled">, string>;

export function getOpenAiFallbackConfig(
  env: Record<string, string | undefined> = process.env
): OpenAiFallbackConfig {
  if (env.AI_PROVIDER_FALLBACK_ENABLED !== "true") {
    return { enabled: false };
  }

  const missingNames = Object.values(envMapping).filter((name) => !env[name]);
  if (missingNames.length > 0) {
    throw new OpenAiFallbackConfigError(missingNames);
  }

  return {
    enabled: true,
    baseUrl: env.OPENAI_BASE_URL as string,
    textApiKey: env.OPENAI_TEXT_API_KEY as string,
    textModel: env.OPENAI_TEXT_MODEL as string,
    imageApiKey: env.OPENAI_IMAGE_API_KEY as string,
    imageModel: env.OPENAI_IMAGE_MODEL as string
  };
}
