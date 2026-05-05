import "server-only";

export type AiDiagnosticsContext = {
  requestId: string;
  route: string;
};

export type AiDiagnosticEvent = AiDiagnosticsContext & {
  draftId?: string;
  errorCode?: string;
  errorName?: string;
  event:
    | "generation_failed"
    | "provider_failure"
    | "provider_fallback_failure"
    | "provider_fallback_start";
  model?: string;
  provider?: "openai" | "qwen";
  providerRequestId?: string;
  stage?: string;
  status?: number;
};

export type SerializedAiError = {
  code?: string;
  message: string;
  model?: string;
  name?: string;
  provider?: "openai" | "qwen";
  providerRequestId?: string;
  status?: number;
};

const PLACEHOLDER_PATTERNS = [
  /^replace[-_ ]?with[-_ ]?/i,
  /^your[-_ ]/i,
  /placeholder/i,
  /^todo$/i,
  /^changeme$/i
];

export function createAiRequestDiagnostics(input: { route: string }): AiDiagnosticsContext {
  const rawId =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const requestId = rawId.replace(/[^a-z0-9]/gi, "").toLowerCase();

  return {
    requestId: `fp_ai_${requestId || "request"}`,
    route: input.route
  };
}

export function unsafeValueLooksPresent(value: string | undefined | null): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function serializeAiError(error: unknown): SerializedAiError {
  const source = isObject(error) ? error : {};
  const name = error instanceof Error ? error.name : safeString(source.name);
  const provider = safeProvider(source.provider);

  return {
    ...(safeString(source.code) ? { code: safeString(source.code) } : {}),
    message: provider ? "Provider request failed." : "AI generation failed.",
    ...(safeString(source.model) ? { model: safeString(source.model) } : {}),
    ...(name ? { name } : {}),
    ...(provider ? { provider } : {}),
    ...(safeString(source.providerRequestId)
      ? { providerRequestId: safeString(source.providerRequestId) }
      : {}),
    ...(safeNumber(source.status) ? { status: safeNumber(source.status) } : {})
  };
}

export function logAiGenerationDiagnostic(event: AiDiagnosticEvent): void {
  console.warn("[fairplay-ai-diagnostics]", JSON.stringify(event));
}

export function providerRequestIdFromHeaders(headers: Headers): string | undefined {
  return (
    headers.get("x-request-id") ??
    headers.get("request-id") ??
    headers.get("x-qwen-request-id") ??
    headers.get("x-dashscope-request-id") ??
    headers.get("openai-request-id") ??
    undefined
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function safeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function safeProvider(value: unknown): "openai" | "qwen" | undefined {
  return value === "openai" || value === "qwen" ? value : undefined;
}
