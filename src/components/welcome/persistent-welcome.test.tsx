import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PersistentWelcome } from "./persistent-welcome";

const retiredGuideLabel = ["App", "Guide", "101"].join(" ");

describe("PersistentWelcome", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stays visible until the user explicitly closes it", async () => {
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
        method: "PATCH"
      })
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("links to the crash course, learn-a-feature area, and card library without dismissing", () => {
    const onDismiss = vi.fn();
    render(<PersistentWelcome dismissed={false} onDismiss={onDismiss} />);

    expect(screen.getByRole("link", { name: "Start crash course" })).toHaveAttribute(
      "href",
      "/app/crash-course"
    );
    expect(screen.getByRole("link", { name: "Learn a feature" })).toHaveAttribute(
      "href",
      "/app/home#learn-a-feature"
    );
    expect(screen.getByRole("link", { name: "Browse card library" })).toHaveAttribute(
      "href",
      "/app/library"
    );
    expect(screen.queryByText(retiredGuideLabel)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open load map" })).not.toBeInTheDocument();
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("does not render after it is dismissed", () => {
    render(<PersistentWelcome dismissed />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
