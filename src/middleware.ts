import { NextRequest, NextResponse } from "next/server";

import {
  applySecurityResponseHeaders,
  buildContentSecurityPolicy,
  CONTENT_SECURITY_POLICY_HEADER,
  createCspNonce,
  isSameOrigin,
  REQUEST_NONCE_HEADER
} from "@/lib/http-security";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "fairplay_session";
const SAFE_REQUEST_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;
  const nonce = createCspNonce();
  const contentSecurityPolicy = buildContentSecurityPolicy(nonce, {
    allowUnsafeEval: process.env.NODE_ENV === "development"
  });
  const rawToken =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ??
    getCookieFromHeader(request.headers.get("cookie"), AUTH_COOKIE_NAME);

  if (
    rawToken &&
    !SAFE_REQUEST_METHODS.has(request.method.toUpperCase()) &&
    !isSameOrigin(request.nextUrl, request.headers.get("origin"))
  ) {
    const response = new NextResponse(null, { status: 403 });
    response.headers.set("cache-control", "no-store");

    return secureResponse(response, contentSecurityPolicy);
  }

  if ((pathname.startsWith("/app/") || pathname === "/app") && !rawToken) {
    return secureResponse(
      NextResponse.redirect(new URL("/login", request.url)),
      contentSecurityPolicy
    );
  }

  // The app layout performs the authoritative DB-backed session and persona check.
  // Middleware only gates obviously anonymous app requests so it never forwards
  // the raw Cookie header to a URL derived from an inbound Host header.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CONTENT_SECURITY_POLICY_HEADER, contentSecurityPolicy);
  requestHeaders.set(REQUEST_NONCE_HEADER, nonce);

  return secureResponse(
    NextResponse.next({
      request: {
        headers: requestHeaders
      }
    }),
    contentSecurityPolicy
  );
}

function secureResponse(
  response: NextResponse,
  contentSecurityPolicy: string
): NextResponse {
  applySecurityResponseHeaders(response.headers, contentSecurityPolicy);
  return response;
}

function getCookieFromHeader(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }

  const cookie = header
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|assets/).*)"
  ]
};
