import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { config, middleware } from "./middleware";

const SESSION_COOKIE = "fairplay_session=raw-session-token";

function expectSecurityHeaders(response: Response) {
  const contentSecurityPolicy = response.headers.get(
    "content-security-policy"
  );

  expect(contentSecurityPolicy).toContain("default-src 'self'");
  expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
  expect(response.headers.get("x-frame-options")).toBe("DENY");
  expect(response.headers.get("referrer-policy")).toBe(
    "strict-origin-when-cross-origin"
  );
  expect(response.headers.get("permissions-policy")).toBe(
    "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
  );

  return contentSecurityPolicy;
}

describe("middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("redirects signed-out app requests to login", async () => {
    const response = await middleware(
      new NextRequest("http://localhost/app/home", {
        headers: {}
      })
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("http://localhost/login");
    expectSecurityHeaders(response);
  });

  it("allows signed-in app requests to continue to the authoritative app layout", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await middleware(
      new NextRequest("http://localhost/app/home", {
        headers: {
          cookie: SESSION_COOKIE
        }
      })
    );

    expect(response?.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
    expectSecurityHeaders(response);
  });

  it("parses a raw cookie header fallback without forwarding it", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const request = new NextRequest("http://localhost/app/home", {
      headers: {
        cookie: SESSION_COOKIE
      }
    });
    vi.spyOn(request.cookies, "get").mockReturnValue(undefined);

    const response = await middleware(request);

    expect(response?.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("treats a malformed fallback cookie as anonymous instead of throwing", async () => {
    const request = new NextRequest("http://localhost/app/home", {
      headers: {
        cookie: "fairplay_session=%"
      }
    });
    vi.spyOn(request.cookies, "get").mockReturnValue(undefined);

    const response = await middleware(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost/login");
    expectSecurityHeaders(response);
  });

  it("uses one nonce consistently for the request and response policy", async () => {
    const response = await middleware(
      new NextRequest("https://fairplay.example/login", {
        headers: {
          "content-security-policy": "default-src *",
          "x-nonce": "attacker-controlled"
        }
      })
    );
    const responsePolicy = expectSecurityHeaders(response);
    const forwardedPolicy = response.headers.get(
      "x-middleware-request-content-security-policy"
    );
    const forwardedNonce = response.headers.get("x-middleware-request-x-nonce");

    expect(forwardedPolicy).toBe(responsePolicy);
    expect(forwardedNonce).toMatch(/^[A-Za-z0-9_-]{16,}$/);
    expect(responsePolicy).toContain(`'nonce-${forwardedNonce}'`);
    expect(responsePolicy).not.toContain("default-src *");
    expect(forwardedNonce).not.toBe("attacker-controlled");
    expect(response.headers.get("x-nonce")).toBeNull();
  });

  it("allows same-origin cookie-authenticated mutations", async () => {
    const response = await middleware(
      new NextRequest("https://fairplay.example/api/personas/select", {
        method: "POST",
        headers: {
          cookie: SESSION_COOKIE,
          origin: "https://fairplay.example"
        }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expectSecurityHeaders(response);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"])(
    "rejects cross-site cookie-authenticated %s mutations",
    async (method) => {
      const response = await middleware(
        new NextRequest("https://fairplay.example/api/personas/select", {
          method,
          headers: {
            cookie: SESSION_COOKIE,
            origin: "https://attacker.example"
          }
        })
      );

      expect(response.status).toBe(403);
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("x-middleware-next")).toBeNull();
      expect(response.headers.get("x-middleware-request-x-nonce")).toBeNull();
      expectSecurityHeaders(response);
    }
  );

  it("rejects cookie-authenticated mutations with a missing Origin header", async () => {
    const response = await middleware(
      new NextRequest("https://fairplay.example/api/preferences/onboarding", {
        method: "PATCH",
        headers: {
          cookie: SESSION_COOKIE
        }
      })
    );

    expect(response.status).toBe(403);
    expectSecurityHeaders(response);
  });

  it.each(["/api/auth/login", "/api/auth/create-household"])(
    "keeps unauthenticated %s submissions available",
    async (pathname) => {
      const response = await middleware(
        new NextRequest(`https://fairplay.example${pathname}`, {
          method: "POST",
          headers: {
            origin: "https://another.example"
          }
        })
      );

      expect(response.status).toBe(200);
      expect(response.headers.get("x-middleware-next")).toBe("1");
      expectSecurityHeaders(response);
    }
  );

  it("does not require Origin for safe cookie-authenticated reads", async () => {
    const response = await middleware(
      new NextRequest("https://fairplay.example/api/auth/me", {
        headers: {
          cookie: SESSION_COOKIE
        }
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("matches API and document routes while excluding heavy static assets", () => {
    expect(config.matcher).toEqual([
      "/((?!_next/static|_next/image|favicon.ico|icons/|assets/).*)"
    ]);
  });
});
