import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY } from "@/components/theme/theme-constants";
import { THEME_INIT_SCRIPT } from "@/components/theme/theme-init-script";

const { headersMock } = vi.hoisted(() => ({
  headersMock: vi.fn()
}));

vi.mock("next/headers", () => ({
  headers: headersMock
}));

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "test-geist-variable" })
}));

import RootLayout from "./layout";

describe("RootLayout security bootstrap", () => {
  beforeEach(() => {
    headersMock.mockReset();
  });

  it("uses the request nonce on the deterministic theme bootstrap", async () => {
    const nonce = "0123456789abcdef0123456789abcdef";
    headersMock.mockResolvedValue(new Headers({ "x-nonce": nonce }));

    const markup = renderToStaticMarkup(
      await RootLayout({ children: <main>Fairplay</main> })
    );

    expect(markup).toContain(`<script nonce="${nonce}">`);
    expect(markup).toContain("<main>Fairplay</main>");
  });

  it("remains renderable when middleware request headers are unavailable", async () => {
    headersMock.mockResolvedValue(new Headers());

    const markup = renderToStaticMarkup(
      await RootLayout({ children: <main>Fairplay</main> })
    );

    expect(markup).toContain("<script>");
    expect(markup).not.toContain("nonce=");
  });

  it("reads only the allowed device theme preference", () => {
    expect(THEME_INIT_SCRIPT).toContain(
      `window.localStorage.getItem("${THEME_STORAGE_KEY}")`
    );
    expect(THEME_INIT_SCRIPT).not.toContain("sessionStorage");
    expect(THEME_INIT_SCRIPT).not.toContain("document.cookie");
  });
});
