import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";

import { setSessionCookie } from "./cookies";

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
});
