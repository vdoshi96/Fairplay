import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PAGE_SHELL_BACKGROUNDS, PageShell } from "./page-shell";

describe("PageShell decorative backgrounds", () => {
  it("keeps artwork decorative and applies the readability wash independently", () => {
    const { container } = render(
      <PageShell background={PAGE_SHELL_BACKGROUNDS.board}>
        <h1>Household board</h1>
      </PageShell>
    );

    const artwork = screen.getByTestId("page-shell-background-board");
    const wash = container.querySelector("[data-page-background-wash]");

    expect(artwork).toHaveAttribute("aria-hidden", "true");
    expect(artwork).toHaveClass("pointer-events-none", "opacity-40");
    expect(artwork.style.getPropertyValue("--fp-background-mobile")).toContain(
      "load-map-workbench-768.avif"
    );
    expect(artwork.style.getPropertyValue("--fp-background-desktop")).toContain(
      "load-map-workbench-1536.webp"
    );
    expect(wash).toHaveAttribute("aria-hidden", "true");
    expect(wash).toHaveClass(
      "fp-page-background-wash",
      "pointer-events-none",
      "absolute",
      "inset-0"
    );
    expect(artwork).not.toContainElement(wash as HTMLElement);
    expect(screen.getByRole("heading", { name: "Household board" })).toBeVisible();
  });

  it("does not add a wash when no generated background is configured", () => {
    const { container } = render(
      <PageShell>
        <p>Plain page</p>
      </PageShell>
    );

    expect(container.querySelector("[data-page-background-wash]")).toBeNull();
  });
});
