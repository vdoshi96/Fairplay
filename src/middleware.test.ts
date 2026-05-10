import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { middleware } from "./middleware";

describe("middleware", () => {
  afterEach(() => {
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
  });

  it("allows signed-in app requests to continue to the authoritative app layout", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = await middleware(
      new NextRequest("http://localhost/app/home", {
        headers: {
          cookie: "fairplay_session=raw-session-token"
        }
      })
    );

    expect(response?.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("parses a raw cookie header fallback without forwarding it", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const response = await middleware(
      new NextRequest("http://localhost/app/home", {
        headers: {
          cookie: "fairplay_session=raw-session-token"
        }
      })
    );

    expect(response?.status).toBe(200);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
