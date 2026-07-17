import { afterEach, describe, expect, it, vi } from "vitest";

import {
  CREATE_HOUSEHOLD_BODY_LIMIT_BYTES,
  readBoundedJsonBody
} from "./request-body-limit";

afterEach(() => {
  vi.restoreAllMocks();
});

function bodySource(input: {
  body: ReadableStream<Uint8Array> | null;
  contentLength?: string;
}) {
  return {
    body: input.body,
    headers: new Headers(
      input.contentLength === undefined
        ? undefined
        : { "content-length": input.contentLength }
    )
  };
}

function byteStream(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(chunk);
      }
      controller.close();
    }
  });
}

describe("readBoundedJsonBody", () => {
  it("rejects an oversized Content-Length before reading or parsing the body", async () => {
    const parse = vi.spyOn(JSON, "parse");
    const source = {
      headers: new Headers({
        "content-length": String(CREATE_HOUSEHOLD_BODY_LIMIT_BYTES + 1)
      }),
      get body(): ReadableStream<Uint8Array> {
        throw new Error("the body must not be read");
      }
    };

    await expect(readBoundedJsonBody(source)).resolves.toEqual({
      ok: false,
      reason: "too_large"
    });
    expect(parse).not.toHaveBeenCalled();
  });

  it("enforces the actual streamed byte count when Content-Length is absent or false", async () => {
    const oversized = new Uint8Array(CREATE_HOUSEHOLD_BODY_LIMIT_BYTES + 1);

    await expect(
      readBoundedJsonBody(
        bodySource({
          body: byteStream(oversized),
          contentLength: "1"
        })
      )
    ).resolves.toEqual({ ok: false, reason: "too_large" });
  });

  it("counts UTF-8 bytes rather than JavaScript string characters", async () => {
    const bodyText = JSON.stringify({ value: "🧹".repeat(3_000) });
    const encoded = new TextEncoder().encode(bodyText);

    expect(bodyText.length).toBeLessThan(CREATE_HOUSEHOLD_BODY_LIMIT_BYTES);
    expect(encoded.byteLength).toBeGreaterThan(CREATE_HOUSEHOLD_BODY_LIMIT_BYTES);
    await expect(
      readBoundedJsonBody(bodySource({ body: byteStream(encoded) }))
    ).resolves.toEqual({ ok: false, reason: "too_large" });
  });

  it("returns a generic invalid result for malformed JSON and invalid lengths", async () => {
    const malformed = new TextEncoder().encode('{"password":"secret"');

    await expect(
      readBoundedJsonBody(bodySource({ body: byteStream(malformed) }))
    ).resolves.toEqual({ ok: false, reason: "invalid" });
    await expect(
      readBoundedJsonBody(
        bodySource({
          body: byteStream(new TextEncoder().encode("{}")),
          contentLength: "not-a-number"
        })
      )
    ).resolves.toEqual({ ok: false, reason: "invalid" });
  });

  it("parses a bounded JSON body assembled from multiple chunks", async () => {
    await expect(
      readBoundedJsonBody(
        bodySource({
          body: byteStream(
            new TextEncoder().encode('{"householdName":"Our'),
            new TextEncoder().encode(' Home"}')
          )
        })
      )
    ).resolves.toEqual({
      ok: true,
      value: { householdName: "Our Home" }
    });
  });
});
