import { describe, expect, it } from "vitest";

import {
  applySecurityResponseHeaders,
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY_HEADER,
  createCspNonce,
  isSameOrigin,
  REQUEST_NONCE_HEADER
} from "./http-security";

describe("HTTP security helpers", () => {
  it("creates independent base64url-safe nonces", () => {
    const first = createCspNonce();
    const second = createCspNonce();

    expect(first).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    expect(second).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    expect(first).not.toBe(second);
  });

  it("builds a nonce-based policy compatible with App Router scripts", () => {
    const nonce = "0123456789abcdef0123456789abcdef";
    const policy = buildContentSecurityPolicy(nonce);

    expect(REQUEST_NONCE_HEADER).toBe("x-nonce");
    expect(policy).toContain(
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    );
    expect(policy).not.toContain("'unsafe-eval'");
    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("allows the development-only script and socket sources when requested", () => {
    const policy = buildContentSecurityPolicy(
      "0123456789abcdef0123456789abcdef",
      { allowUnsafeEval: true }
    );

    expect(policy).toContain("'unsafe-eval'");
    expect(policy).toContain("connect-src 'self' ws: wss:");
  });

  it("rejects nonce values that could inject another policy directive", () => {
    expect(() =>
      buildContentSecurityPolicy("short; script-src *")
    ).toThrow("CSP nonce must be a base64url-safe random value.");
  });

  it("applies centralized response protection headers", () => {
    const headers = new Headers();
    const policy = buildContentSecurityPolicy(
      "0123456789abcdef0123456789abcdef"
    );

    applySecurityResponseHeaders(headers, policy);

    expect(headers.get(CONTENT_SECURITY_POLICY_HEADER)).toBe(policy);
    expect(headers.get("x-frame-options")).toBe("DENY");
    expect(headers.get("referrer-policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(headers.get("permissions-policy")).toBe(
      "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
    );
    expect(headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("compares serialized origins rather than trusting host-like prefixes", () => {
    const requestUrl = new URL("https://fairplay.example/api/responsibilities");

    expect(isSameOrigin(requestUrl, "https://fairplay.example")).toBe(true);
    expect(isSameOrigin(requestUrl, "https://fairplay.example:443")).toBe(true);
    expect(isSameOrigin(requestUrl, "https://fairplay.example.evil.test")).toBe(
      false
    );
    expect(isSameOrigin(requestUrl, "http://fairplay.example")).toBe(false);
    expect(isSameOrigin(requestUrl, "null")).toBe(false);
    expect(isSameOrigin(requestUrl, null)).toBe(false);
    expect(isSameOrigin(requestUrl, "not a URL")).toBe(false);
  });
});
