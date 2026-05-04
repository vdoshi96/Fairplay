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

  const authState = await fetchAuthState(request);

  if (!authState.authenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!authState.selectedPersonaId) {
    return NextResponse.redirect(new URL("/choose-persona", request.url));
  }

  return NextResponse.next();
}

async function fetchAuthState(request: NextRequest): Promise<{
  authenticated: boolean;
  selectedPersonaId: string | null;
}> {
  try {
    const response = await fetch(new URL("/api/auth/me", request.url), {
      headers: {
        cookie: request.headers.get("cookie") ?? ""
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        authenticated: false,
        selectedPersonaId: null
      };
    }

    const body = (await response.json()) as {
      authenticated?: boolean;
      selectedPersonaId?: string | null;
    };

    return {
      authenticated: body.authenticated !== false,
      selectedPersonaId: body.selectedPersonaId ?? null
    };
  } catch {
    return {
      authenticated: false,
      selectedPersonaId: null
    };
  }
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
