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

  it("redirects signed-in app requests without a persona to persona selection", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ selectedPersonaId: null }, { status: 200 }))
    );

    const response = await middleware(
      new NextRequest("http://localhost/app/home", {
        headers: {
          cookie: "fairplay_session=raw-session-token"
        }
      })
    );

    expect(response?.status).toBe(307);
    expect(response?.headers.get("location")).toBe("http://localhost/choose-persona");
  });

  it("allows signed-in app requests with a selected persona", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          { selectedPersonaId: "56f3a328-af6d-4d1d-b8c7-603640126633" },
          { status: 200 }
        )
      )
    );

    const response = await middleware(
      new NextRequest("http://localhost/app/home", {
        headers: {
          cookie: "fairplay_session=raw-session-token"
        }
      })
    );

    expect(response?.status).toBe(200);
  });
});
