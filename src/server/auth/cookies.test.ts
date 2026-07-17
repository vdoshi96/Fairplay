import { NextResponse } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  setSessionCookie,
  shouldUseSecureSessionCookie
} from "./cookies";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("session cookies", () => {
  it("sets a positive max age for future expirations", () => {
    const response = NextResponse.json({});

    setSessionCookie(
      response,
      "raw-session-token",
      "2026-05-04T12:01:00.000Z",
      new Date("2026-05-04T12:00:00.000Z")
    );

    expect(response.headers.get("set-cookie")).toContain("Max-Age=60");
  });

  it("sets max age to zero for immediate expirations", () => {
    const response = NextResponse.json({});

    setSessionCookie(
      response,
      "raw-session-token",
      "2026-05-04T12:00:00.000Z",
      new Date("2026-05-04T12:00:00.000Z")
    );

    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("sets max age to zero for past expirations", () => {
    const response = NextResponse.json({});

    setSessionCookie(
      response,
      "raw-session-token",
      "2026-05-04T11:59:00.000Z",
      new Date("2026-05-04T12:00:00.000Z")
    );

    expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("rejects invalid expirations instead of creating a default active cookie", () => {
    const response = NextResponse.json({});

    expect(() =>
      setSessionCookie(response, "raw-session-token", "not-a-date")
    ).toThrow("Invalid session expiration.");
  });

  it("keeps production cookies secure for deployed and invalid origins", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ALLOW_INSECURE_LOOPBACK_SESSION_COOKIE", "true");

    vi.stubEnv("APP_BASE_URL", "https://fairplay.example");
    expect(shouldUseSecureSessionCookie()).toBe(true);

    vi.stubEnv("APP_BASE_URL", "http://fairplay.example");
    expect(shouldUseSecureSessionCookie()).toBe(true);

    vi.stubEnv("APP_BASE_URL", "not-a-url");
    expect(shouldUseSecureSessionCookie()).toBe(true);
  });

  it("requires an explicit opt-in for local production-server QA", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_BASE_URL", "http://localhost:3101");

    expect(shouldUseSecureSessionCookie()).toBe(true);

    vi.stubEnv("ALLOW_INSECURE_LOOPBACK_SESSION_COOKIE", "true");

    for (const appBaseUrl of [
      "http://localhost:3101",
      "http://127.0.0.1:3101",
      "http://[::1]:3101"
    ]) {
      vi.stubEnv("APP_BASE_URL", appBaseUrl);
      expect(shouldUseSecureSessionCookie()).toBe(false);
    }
  });

  it("does not require Secure cookies in development", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("APP_BASE_URL", "https://fairplay.example");

    expect(shouldUseSecureSessionCookie()).toBe(false);
  });
});
