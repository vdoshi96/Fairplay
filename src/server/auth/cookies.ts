import type { NextRequest, NextResponse } from "next/server";

export function getAuthCookieName(): string {
  return process.env.AUTH_COOKIE_NAME || "fairplay_session";
}

export function getSessionCookieValue(request: NextRequest): string | null {
  return request.cookies.get(getAuthCookieName())?.value ?? null;
}

export function shouldUseSecureSessionCookie(): boolean {
  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  if (process.env.ALLOW_INSECURE_LOOPBACK_SESSION_COOKIE !== "true") {
    return true;
  }

  try {
    const appBaseUrl = new URL(process.env.APP_BASE_URL ?? "");
    const loopbackHost = new Set(["localhost", "127.0.0.1", "[::1]"]);

    if (
      appBaseUrl.protocol === "http:" &&
      loopbackHost.has(appBaseUrl.hostname.toLowerCase())
    ) {
      return false;
    }
  } catch {
    // Missing or invalid canonical origins fail closed in production.
  }

  return true;
}

export function setSessionCookie(
  response: NextResponse,
  rawToken: string,
  expiresAt: string | Date,
  now = new Date()
): void {
  const absoluteExpiresAt = new Date(expiresAt);
  const expiresAtMs = absoluteExpiresAt.getTime();
  const nowMs = now.getTime();

  if (!Number.isFinite(expiresAtMs) || !Number.isFinite(nowMs)) {
    throw new Error("Invalid session expiration.");
  }

  const maxAge = Math.max(
    0,
    Math.floor((expiresAtMs - nowMs) / 1000)
  );

  response.cookies.set(getAuthCookieName(), rawToken, {
    httpOnly: true,
    secure: shouldUseSecureSessionCookie(),
    sameSite: "lax",
    path: "/",
    maxAge
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(getAuthCookieName(), "", {
    httpOnly: true,
    secure: shouldUseSecureSessionCookie(),
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
