import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "fairplay_session";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/app/") && pathname !== "/app") {
    return NextResponse.next();
  }

  const rawToken =
    request.cookies.get(AUTH_COOKIE_NAME)?.value ??
    getCookieFromHeader(request.headers.get("cookie"), AUTH_COOKIE_NAME);
  if (!rawToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // The app layout performs the authoritative DB-backed session and persona check.
  // Middleware only gates obviously anonymous app requests so it never forwards
  // the raw Cookie header to a URL derived from an inbound Host header.
  return NextResponse.next();
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
  matcher: ["/app/:path*"]
};
