import type { NextRequest, NextResponse } from "next/server";

import { SESSION_ABSOLUTE_EXPIRATION_MS } from "./sessions";

export function getAuthCookieName(): string {
  return process.env.AUTH_COOKIE_NAME || "fairplay_session";
}

export function getSessionCookieValue(request: NextRequest): string | null {
  return request.cookies.get(getAuthCookieName())?.value ?? null;
}

export function setSessionCookie(
  response: NextResponse,
  rawToken: string,
  expiresAt: string | Date,
  now = new Date()
): void {
  const absoluteExpiresAt = new Date(expiresAt);
  const maxAge = Math.max(
    0,
    Math.floor((absoluteExpiresAt.getTime() - now.getTime()) / 1000)
  );

  response.cookies.set(getAuthCookieName(), rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAge || Math.floor(SESSION_ABSOLUTE_EXPIRATION_MS / 1000)
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(getAuthCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}
