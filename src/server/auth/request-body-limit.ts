export const CREATE_HOUSEHOLD_BODY_LIMIT_BYTES = 8 * 1024;

export type BoundedJsonBodyResult =
  | {
      ok: true;
      value: unknown;
    }
  | {
      ok: false;
      reason: "invalid" | "too_large";
    };

type RequestBodySource = {
  body: ReadableStream<Uint8Array<ArrayBufferLike>> | null;
  headers: Headers;
};

export async function readBoundedJsonBody(
  request: RequestBodySource,
  maxBytes = CREATE_HOUSEHOLD_BODY_LIMIT_BYTES
): Promise<BoundedJsonBodyResult> {
  const declaredLength = parseContentLength(request.headers.get("content-length"));

  if (declaredLength === "invalid") {
    return { ok: false, reason: "invalid" };
  }

  if (declaredLength !== null && declaredLength > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  if (!request.body) {
    return { ok: false, reason: "invalid" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const chunk = await reader.read();

      if (chunk.done) {
        break;
      }

      receivedBytes += chunk.value.byteLength;
      if (receivedBytes > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The size decision is already final even if the source rejects cancel().
        }
        return { ok: false, reason: "too_large" };
      }

      chunks.push(chunk.value);
    }
  } catch {
    return { ok: false, reason: "invalid" };
  } finally {
    reader.releaseLock();
  }

  const bodyBytes = new Uint8Array(receivedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const bodyText = new TextDecoder("utf-8", { fatal: true }).decode(bodyBytes);
    return {
      ok: true,
      value: JSON.parse(bodyText) as unknown
    };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

function parseContentLength(value: string | null): number | "invalid" | null {
  if (value === null) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 20 || !/^\d+$/.test(trimmed)) {
    return "invalid";
  }

  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : "invalid";
}
