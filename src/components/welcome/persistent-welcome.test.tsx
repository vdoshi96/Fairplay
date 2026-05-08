import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PersistentWelcome } from "./persistent-welcome";

const pathname = vi.hoisted(() => vi.fn(() => "/app/your-cards"));

vi.mock("next/navigation", () => ({
  usePathname: pathname
}));

const retiredGuideLabel = ["App", "Guide", "101"].join(" ");

describe("PersistentWelcome", () => {
  afterEach(() => {
    pathname.mockReturnValue("/app/your-cards");
    vi.unstubAllGlobals();
  });

  it("renders a prominent welcome on the Your Cards route", () => {
    pathname.mockReturnValue("/app/your-cards");

    render(<PersistentWelcome dismissed={false} />);

    expect(
      screen.getByRole("dialog", { name: "Welcome to Fairplay" })
    ).toHaveAttribute("data-welcome-variant", "prominent");
    expect(
      screen.getByRole("heading", { name: "Welcome to Fairplay" })
    ).toBeVisible();
  });

  it("renders a compact welcome on feature routes without duplicating the learner action", () => {
    pathname.mockReturnValue("/app/library");

    render(<PersistentWelcome dismissed={false} />);

    const welcome = screen.getByRole("dialog", { name: "Welcome to Fairplay" });
    expect(welcome).toHaveAttribute("data-welcome-variant", "compact");
    expect(
      screen.getByText("Theory and the card library are nearby.")
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Open Theory" })).toHaveAttribute(
      "href",
      "/app/crash-course"
    );
    expect(screen.queryByRole("link", { name: "Learn a feature" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse card library" })).toHaveAttribute(
      "href",
      "/app/library"
    );
    const compactActions = screen.getByTestId("welcome-compact-actions");
    expect(compactActions).toContainElement(
      screen.getByRole("link", { name: "Open Theory" })
    );
    expect(compactActions).toContainElement(
      screen.getByRole("link", { name: "Browse card library" })
    );
    expect(compactActions).toContainElement(
      screen.getByRole("button", { name: "Close welcome" })
    );
  });

  it("stays visible until the user explicitly closes it", async () => {
    pathname.mockReturnValue("/app/library");
    const onDismiss = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ welcomeDismissedAt: "2026-05-04T12:00:00.000Z" })
    });
    vi.stubGlobal("fetch", fetchMock);

    const { rerender } = render(
      <PersistentWelcome dismissed={false} onDismiss={onDismiss} />
    );

    expect(
      screen.getByRole("dialog", { name: "Welcome to Fairplay" })
    ).toBeVisible();

    rerender(<PersistentWelcome dismissed={false} onDismiss={onDismiss} />);
    expect(
      screen.getByRole("dialog", { name: "Welcome to Fairplay" })
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Close welcome" }));

    await waitFor(() => expect(onDismiss).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/onboarding",
      expect.objectContaining({
        body: expect.stringContaining("welcomeDismissedAt"),
        method: "PATCH"
      })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("links to the crash course and card library without duplicating the learner area", () => {
    const onDismiss = vi.fn();
    render(<PersistentWelcome dismissed={false} onDismiss={onDismiss} />);

    expect(screen.getByRole("link", { name: "Open Theory" })).toHaveAttribute(
      "href",
      "/app/crash-course"
    );
    expect(screen.queryByRole("link", { name: "Learn a feature" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse card library" })).toHaveAttribute(
      "href",
      "/app/library"
    );
    expect(screen.queryByText(retiredGuideLabel)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open load map" })).not.toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not render after it is dismissed", () => {
    pathname.mockReturnValue("/app/library");

    const { rerender } = render(<PersistentWelcome dismissed />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    pathname.mockReturnValue("/app/your-cards");
    rerender(<PersistentWelcome dismissed />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
