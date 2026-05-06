import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { HouseholdSummary } from "@/contracts/auth";
import type { PersonaSummary } from "@/contracts/personas";
import { SettingsPanel } from "./settings-panel";

const routerPush = vi.hoisted(() => vi.fn());
const routerReplace = vi.hoisted(() => vi.fn());
const routerRefresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: routerPush,
    replace: routerReplace,
    refresh: routerRefresh
  })
}));

const household: HouseholdSummary = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "River Home",
  timezone: "America/Chicago"
};

const selectedPersona: PersonaSummary = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  key: "alex",
  displayName: "Alex",
  avatarKey: "alex"
};

const retiredGuideLabel = ["App", "Guide", "101"].join(" ");

function renderSettings() {
  render(<SettingsPanel household={household} selectedPersona={selectedPersona} />);
}

function openSwitchDialog() {
  const trigger = screen.getByRole("button", { name: "Switch persona" });
  trigger.focus();
  fireEvent.click(trigger);
  return {
    trigger,
    dialog: screen.getByRole("dialog", { name: "Switch active persona?" }),
    continueButton: screen.getByRole("button", { name: "Continue" }),
    cancelButton: screen.getByRole("button", { name: "Cancel" })
  };
}

describe("settings panel", () => {
  afterEach(() => {
    routerPush.mockReset();
    routerReplace.mockReset();
    routerRefresh.mockReset();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("moves focus into the persona switch dialog when opened", async () => {
    renderSettings();

    const { continueButton } = openSwitchDialog();

    await waitFor(() => expect(continueButton).toHaveFocus());
    expect(
      screen.getByText("You will choose Alex or Max again before returning to the app.")
    ).toBeVisible();
  });

  it("keeps tab focus inside the persona switch dialog", async () => {
    renderSettings();

    const { dialog, continueButton, cancelButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(continueButton).toHaveFocus();
  });

  it("hides background settings controls from the accessibility tree while open", async () => {
    renderSettings();

    const { continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    expect(screen.queryByRole("button", { name: "Switch persona" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Log out" })).not.toBeInTheDocument();
  });

  it("closes with Cancel and restores focus to the trigger", async () => {
    renderSettings();

    const { trigger, cancelButton, continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("closes with Escape and restores focus to the trigger", async () => {
    renderSettings();

    const { trigger, dialog, continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("continues to persona selection when confirmed", async () => {
    renderSettings();

    const { continueButton } = openSwitchDialog();
    await waitFor(() => expect(continueButton).toHaveFocus());

    fireEvent.click(continueButton);

    expect(routerPush).toHaveBeenCalledWith("/choose-persona?next=/app/home");
  });

  it("restarts the crash course through onboarding preferences", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Restart crash course" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/onboarding",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" }
      })
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      crashCourseCurrentStep: 0,
      crashCourseSkippedAt: null,
      crashCourseCompletedAt: null
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).crashCourseReplayRequestedAt)
      .toEqual(expect.any(String));
    expect(routerPush).toHaveBeenCalledWith("/app/crash-course");
    expect(routerRefresh).toHaveBeenCalledTimes(1);
  });

  it("shows the persistent welcome again through the replay API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Show welcome again" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/preferences/welcome/replay",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(routerRefresh).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent(
      "Welcome will show again across the app."
    );
  });

  it("marks settings guide targets and links back to replay learning", () => {
    const { container } = render(
      <SettingsPanel household={household} selectedPersona={selectedPersona} />
    );

    expect(container.querySelector('[data-guide-id="settings-persona"]')).not.toBeNull();
    expect(
      container.querySelector('[data-guide-id="settings-guided-start"]')
    ).not.toBeNull();
    expect(container.querySelector('[data-guide-id="settings-logout"]')).not.toBeNull();
    expect(screen.getByRole("link", { name: "Open learning hub" })).toHaveAttribute(
      "href",
      "/app/home#learn-a-feature"
    );
    expect(screen.queryByText(retiredGuideLabel)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Replay feature tours from each feature page using Learn this feature."
      )
    ).toBeVisible();
  });

  it("walks through local dummy settings practice without changing account data", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderSettings();

    fireEvent.click(screen.getByRole("button", { name: "Learn this feature" }));
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Start dummy Settings workflow" }));
    expect(screen.getByRole("region", { name: "Dummy Settings practice" }))
      .toBeVisible();

    fireEvent.change(screen.getByLabelText("Dummy appearance mode"), {
      target: { value: "dark" }
    });
    expect(screen.getByText("Dummy appearance mode changed to Dark.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Check dummy welcome replay" }));
    expect(screen.getByText("Dummy welcome replay checked.")).toBeVisible();

    fireEvent.click(
      screen.getByRole("button", { name: "Open dummy persona confirmation" })
    );
    expect(
      screen.getByRole("dialog", { name: "Dummy persona switch confirmation" })
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Stay in settings" }));

    fireEvent.click(screen.getByRole("button", { name: "Locate dummy learning hub" }));
    expect(screen.getByText("Dummy Settings workflow complete.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(routerPush).not.toHaveBeenCalled();
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(routerReplace).not.toHaveBeenCalled();
  });
});
